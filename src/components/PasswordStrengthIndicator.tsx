import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { PasswordRequirements } from '../types/auth';

interface PasswordStrengthIndicatorProps {
  requirements: PasswordRequirements;
  showDetails?: boolean;
}

export default function PasswordStrengthIndicator({ 
  requirements, 
  showDetails = true 
}: PasswordStrengthIndicatorProps) {
  const [strength, setStrength] = useState<{
    score: number;
    text: string;
    color: string;
    percentage: number;
  }>({
    score: 0,
    text: 'Weak',
    color: 'bg-red-500',
    percentage: 0
  });

  // Update strength calculation when requirements change
  useEffect(() => {
    const passedChecks = Object.values(requirements).filter(Boolean).length;
    const percentage = (passedChecks / 5) * 100;
    
    let text = 'Weak';
    let color = 'bg-red-500';
    
    if (passedChecks === 5) {
      text = 'Strong';
      color = 'bg-green-500';
    } else if (passedChecks >= 3) {
      text = 'Moderate';
      color = 'bg-yellow-500';
    }
    
    setStrength({
      score: passedChecks,
      text,
      color,
      percentage
    });
  }, [requirements]);

  // Determine icon based on requirement status
  const getRequirementIcon = (fulfilled: boolean) => {
    if (fulfilled) {
      return <Check className="w-3 h-3 text-green-500" />;
    }
    return <X className="w-3 h-3 text-gray-400" />;
  };

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <div className="h-2 flex-1 rounded-full bg-gray-200">
          <div
            className={`h-2 rounded-full transition-all ${strength.color}`}
            style={{ width: `${strength.percentage}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${
          strength.text === 'Strong' ? 'text-green-600' : 
          strength.text === 'Moderate' ? 'text-yellow-600' : 
          'text-red-600'
        }`}>
          {strength.text}
        </span>
      </div>
      
      {showDetails && (
        <ul className="mt-2 space-y-1 text-sm">
          <li className={`flex items-center gap-2 ${requirements.minLength ? 'text-green-600' : 'text-gray-500'}`}>
            <span className="flex-shrink-0">
              {getRequirementIcon(requirements.minLength)}
            </span>
            At least 8 characters
          </li>
          <li className={`flex items-center gap-2 ${requirements.hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
            <span className="flex-shrink-0">
              {getRequirementIcon(requirements.hasUpperCase)}
            </span>
            One uppercase letter
          </li>
          <li className={`flex items-center gap-2 ${requirements.hasLowerCase ? 'text-green-600' : 'text-gray-500'}`}>
            <span className="flex-shrink-0">
              {getRequirementIcon(requirements.hasLowerCase)}
            </span>
            One lowercase letter
          </li>
          <li className={`flex items-center gap-2 ${requirements.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
            <span className="flex-shrink-0">
              {getRequirementIcon(requirements.hasNumber)}
            </span>
            One number
          </li>
          <li className={`flex items-center gap-2 ${requirements.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}`}>
            <span className="flex-shrink-0">
              {getRequirementIcon(requirements.hasSpecialChar)}
            </span>
            One special character
          </li>
        </ul>
      )}
    </div>
  );
}