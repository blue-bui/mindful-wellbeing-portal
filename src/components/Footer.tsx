
import React from 'react';
import { Phone, Mail, ExternalLink } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t bg-white py-6 mt-auto">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-wellness-teal mb-3">Preventing Suicide</h3>
            <p className="text-sm text-gray-600">
              A project developed to help identify and support individuals who may be at risk.
              For educational and research purposes only.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-wellness-teal mb-3">Crisis Resources</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Phone size={16} />
                <span>National Suicide Prevention Lifeline: 988</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} />
                <span>Text HOME to 741741</span>
              </li>
              <li className="flex items-center gap-2">
                <ExternalLink size={16} />
                <a href="https://suicidepreventionlifeline.org" target="_blank" rel="noopener noreferrer" className="text-wellness-teal hover:underline">
                  Suicide Prevention Lifeline
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-wellness-teal mb-3">Important Notice</h3>
            <p className="text-sm text-gray-600">
              This project is for educational purposes only. It is not a substitute for professional medical advice,
              diagnosis, or treatment. Please consult healthcare professionals for all medical concerns.
            </p>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Preventing Suicide. A college minor project. Not for commercial use.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
