import { supabase } from './supabase';

// Dashboard data service using Supabase
export const supabaseData = {
  async getDashboardCounts() {
    try {
      // Get providers count
      const { count: companiesCount, error: providersError } = await supabase
        .from('providers')
        .select('*', { count: 'exact', head: true });

      // Get contracts count
      const { count: contractsCount, error: contractsError } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true });

      // Get data types count (as proxy for data elements)
      const { count: dataTypesCount, error: dataTypesError } = await supabase
        .from('data_types')
        .select('*', { count: 'exact', head: true });

      // Get consents count (as proxy for privacy statements)
      const { count: consentsCount, error: consentsError } = await supabase
        .from('user_provider_consents')
        .select('*', { count: 'exact', head: true });

      if (providersError || contractsError || dataTypesError || consentsError) {
        throw new Error('Error fetching dashboard counts');
      }

      return {
        companies: companiesCount || 0,
        contracts: contractsCount || 0,
        dataElements: dataTypesCount || 0,
        privacyStatements: consentsCount || 0,
      };
    } catch (error) {
      console.error('Error in getDashboardCounts:', error);
      throw error;
    }
  },

  async getProviders() {
    try {
      // Get current user to filter providers properly
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Get all providers
      const { data: allProviders, error: providersError } = await supabase
        .from('providers')
        .select(`
          *,
          provider_data_types(
            data_type_id,
            data_types(name)
          )
        `);

      if (providersError) throw providersError;
      
      // Get user consents for these providers
      const { data: userConsents, error: consentsError } = await supabase
        .from('user_provider_consents')
        .select('*')
        .eq('user_id', user.id);
        
      if (consentsError) throw consentsError;

      // Format providers in the expected format for the app
      return allProviders.map(provider => {
        // Extract data types
        const dataTypes = provider.provider_data_types
          ?.filter(dt => dt.data_types?.name)
          .map(dt => dt.data_types.name) || ['Medical Records'];

        // Find user consent for this provider
        const userConsent = userConsents?.find(consent => 
          consent.provider_id === provider.id
        );

        return {
          id: provider.id,
          name: provider.name,
          category: provider.category || 'Healthcare Provider',
          status: provider.status || 'active',
          dataTypes: dataTypes.length > 0 ? dataTypes : ['Medical Records'],
          lastSync: provider.updated_at || new Date().toISOString(),
          logo: provider.logo || '/elroi-logo.svg',
          permissions: userConsent ? {
            labResults: userConsent.lab_results || false,
            medications: userConsent.medications || false,
            fitnessData: userConsent.fitness_data || false
          } : {
            labResults: false,
            medications: false,
            fitnessData: false
          }
        };
      }) || [];
    } catch (error) {
      console.error('Error in getProviders:', error);
      throw error;
    }
  },

  async getContracts() {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          providers(*)
        `);

      if (error) throw error;

      return data?.map(contract => ({
        id: contract.id,
        title: contract.title,
        description: contract.description || '',
        status: contract.status,
        companyId: contract.provider_id,
        company: contract.providers ? {
          id: contract.providers.id,
          name: contract.providers.name,
          logo: contract.providers.logo
        } : undefined,
        createdAt: contract.created_at,
        updatedAt: contract.updated_at
      })) || [];
    } catch (error) {
      console.error('Error in getContracts:', error);
      throw error;
    }
  },
  
  async getHealthRecords() {
    try {
      const { data, error } = await supabase
        .from('health_records')
        .select(`
          *,
          providers(*)
        `);

      if (error) throw error;

      return data?.map(record => ({
        id: record.id,
        title: record.title,
        content: record.content || '',
        date: record.created_at,
        type: record.type || 'medical',
        provider: record.providers ? {
          name: record.providers.name,
          logo: record.providers.logo || '/elroi-logo.svg'
        } : undefined
      })) || [];
    } catch (error) {
      console.error('Error in getHealthRecords:', error);
      throw error;
    }
  },

  async getAppointments() {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          providers(*)
        `);

      if (error) throw error;

      return data?.map(appointment => ({
        id: appointment.id,
        provider: appointment.providers ? {
          name: appointment.providers.name,
          logo: appointment.providers.logo || '/elroi-logo.svg'
        } : { name: 'Unknown Provider', logo: '/elroi-logo.svg' },
        date: appointment.date,
        time: appointment.time,
        type: appointment.type,
        status: appointment.status,
        details: appointment.details
      })) || [];
    } catch (error) {
      console.error('Error in getAppointments:', error);
      throw error;
    }
  },

  async bookAppointment(appointmentData: any) {
    try {
      const { error } = await supabase
        .from('appointments')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          provider_id: appointmentData.providerId,
          type: appointmentData.type,
          date: appointmentData.date,
          time: appointmentData.time,
          status: 'pending',
          details: appointmentData.details || {}
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error in bookAppointment:', error);
      throw error;
    }
  },

  async getHealthMetrics() {
    try {
      const { data, error } = await supabase
        .from('health_metrics')
        .select('*')
        .order('recorded_at', { ascending: false });

      if (error) throw error;

      return data?.map(metric => ({
        id: metric.id,
        type: metric.metric_type,
        value: metric.value,
        unit: metric.unit,
        date: metric.recorded_at,
        source: metric.source
      })) || [];
    } catch (error) {
      console.error('Error in getHealthMetrics:', error);
      throw error;
    }
  },

  async addHealthMetric(metricData: any) {
    try {
      const { error } = await supabase
        .from('health_metrics')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          metric_type: metricData.type,
          value: metricData.value.toString(),
          unit: metricData.unit,
          source: metricData.source || 'manual entry'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error in addHealthMetric:', error);
      throw error;
    }
  },

  async getUserSettings() {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // If no settings found, return defaults
      if (!data) {
        return {
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
        };
      }

      return {
        emailNotifications: data.email_notifications,
        smsNotifications: data.sms_notifications,
        pushNotifications: data.push_notifications,
      };
    } catch (error) {
      console.error('Error in getUserSettings:', error);
      throw error;
    }
  },

  async updateUserSettings(settings: any) {
    try {
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('*')
        .single();

      // If settings exist, update them
      if (existingSettings) {
        const { error } = await supabase
          .from('user_settings')
          .update({
            email_notifications: settings.emailNotifications,
            sms_notifications: settings.smsNotifications,
            push_notifications: settings.pushNotifications,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

        if (error) throw error;
      } 
      // Otherwise, insert new settings
      else {
        const { error } = await supabase
          .from('user_settings')
          .insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            email_notifications: settings.emailNotifications,
            sms_notifications: settings.smsNotifications,
            push_notifications: settings.pushNotifications
          });

        if (error) throw error;
      }

      return settings;
    } catch (error) {
      console.error('Error in updateUserSettings:', error);
      throw error;
    }
  }
};