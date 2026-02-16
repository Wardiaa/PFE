import React, { useState } from 'react';
import Input from '../../../components/ui/Input2';
import Button from '../../../components/ui/Button2';
import AppIcon from '../../../components/AppIcon';

interface JoinData {
  code: string;
  name: string;
}

interface SessionJoinFormProps {
  onJoin: (data: JoinData) => void;
}

interface Errors {
  sessionCode?: string;
  participantName?: string;
}

const SessionJoinForm: React.FC<SessionJoinFormProps> = ({ onJoin }) => {
  const [sessionCode, setSessionCode] = useState<string>('');
  const [participantName, setParticipantName] = useState<string>('');
  const [errors, setErrors] = useState<Errors>({});
  const [isJoining, setIsJoining] = useState<boolean>(false);

  const validateForm = (): boolean => {
    const newErrors: Errors = {};
    
    if (!sessionCode?.trim()) {
      newErrors.sessionCode = 'Session code is required';
    } else if (sessionCode?.trim()?.length < 6) {
      newErrors.sessionCode = 'Session code must be at least 6 characters';
    }
    
    if (!participantName?.trim()) {
      newErrors.participantName = 'Your name is required';
    } else if (participantName?.trim()?.length < 2) {
      newErrors.participantName = 'Name must be at least 2 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e?.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsJoining(true);
    
    setTimeout(() => {
      onJoin({
        code: sessionCode?.trim()?.toUpperCase(),
        name: participantName?.trim()
      });
      setIsJoining(false);
    }, 800);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e?.target?.value?.toUpperCase()?.replace(/[^A-Z0-9]/g, '');
    setSessionCode(value);
    if (errors?.sessionCode) {
      setErrors({ ...errors, sessionCode: '' });
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setParticipantName(e?.target?.value);
    if (errors?.participantName) {
      setErrors({ ...errors, participantName: '' });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card rounded-xl p-6 md:p-8 lg:p-10 shadow-lg border border-border">
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-linear-to-br from-primary to-secondary mb-4">
            <AppIcon name="Users" size={32} color="#FFFFFF" />
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Join Session
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Enter the session code provided by your presenter
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
          <Input
            label="Session Code"
            type="text"
            placeholder="ABC123"
            value={sessionCode}
            onChange={handleCodeChange}
            error={errors?.sessionCode}
            required
            maxLength={10}
            className="text-center text-lg md:text-xl font-semibold tracking-wider"
          />

          <Input
            label="Your Name"
            type="text"
            placeholder="Enter your name"
            value={participantName}
            onChange={handleNameChange}
            error={errors?.participantName}
            required
            maxLength={50}
          />

          <Button
            type="submit"
            variant="default"
            size="lg"
            fullWidth
            loading={isJoining}
            iconName="ArrowRight"
            iconPosition="right"
            className="mt-6"
          >
            Join Session
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <AppIcon name="Info" size={18} className="shrink-0 mt-0.5" />
            <p>
              No registration required. Your responses are anonymous unless you choose to share your name.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionJoinForm;