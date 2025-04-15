
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const MedicalDisclaimer = () => {
  return (
    <Alert className="my-4 border-wellness-accent/30 bg-wellness-accent/10">
      <AlertCircle className="h-4 w-4 text-wellness-accent" />
      <AlertTitle className="text-wellness-accent font-semibold">
        Important Medical Disclaimer
      </AlertTitle>
      <AlertDescription className="text-sm">
        This tool is designed for early intervention and support only. It is not a substitute for
        professional medical advice, diagnosis, or treatment. Always seek the advice of qualified
        health providers with any questions you may have regarding mental health conditions.
        If you or someone you know is in crisis, please contact a crisis hotline immediately or seek
        emergency medical help.
      </AlertDescription>
    </Alert>
  );
};

export default MedicalDisclaimer;
