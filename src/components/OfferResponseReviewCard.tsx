import React, { useState } from 'react';
import { OfferResponseReview, OfferResponseIntent } from '../lib/types';
import { CheckCircle, XCircle, Edit, HelpCircle, Phone, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface OfferResponseReviewCardProps {
  review: OfferResponseReview;
  onConfirm: (intent: OfferResponseIntent) => void;
}

export const OfferResponseReviewCard: React.FC<OfferResponseReviewCardProps> = ({ review, onConfirm }) => {
  const [selectedIntent, setSelectedIntent] = useState<OfferResponseIntent>(review.detectedIntent);
  const [expanded, setExpanded] = useState(false);

  if (review.status === 'confirmed' || review.status === 'corrected') {
    return null; // Don't show after confirmed
  }

  const getIntentIcon = (intent: OfferResponseIntent) => {
    switch (intent) {
      case 'accepted': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'declined': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'change_requested': return <Edit className="w-5 h-5 text-orange-500" />;
      case 'question': return <HelpCircle className="w-5 h-5 text-blue-500" />;
      case 'callback_requested': return <Phone className="w-5 h-5 text-purple-500" />;
      case 'unclear': return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getIntentLabel = (intent: OfferResponseIntent) => {
    switch (intent) {
      case 'accepted': return 'Angebot angenommen';
      case 'declined': return 'Angebot abgelehnt';
      case 'change_requested': return 'Änderungswunsch';
      case 'question': return 'Rückfrage';
      case 'callback_requested': return 'Rückrufbitte';
      case 'unclear': return 'Unklar';
    }
  };

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Kundenantwort zum Angebot</h3>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          review.confidence === 'high' ? 'bg-green-100 text-green-800' :
          review.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          Konfidenz: {review.confidence}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          {getIntentIcon(review.detectedIntent)}
          <span className="font-medium">Erkannte Reaktion: {getIntentLabel(review.detectedIntent)}</span>
        </div>
        <p className="text-sm text-gray-600 mb-2">{review.summary}</p>
      </div>

      {review.requestedChanges.length > 0 && (
        <div className="mb-4 bg-orange-50 p-3 rounded-md">
          <h4 className="text-sm font-medium text-orange-800 mb-2">Erkannte Änderungen:</h4>
          <ul className="list-disc pl-5 text-sm text-orange-900 space-y-1">
            {review.requestedChanges.map((change, i) => (
              <li key={i}>{change.field}: {change.description}</li>
            ))}
          </ul>
        </div>
      )}

      {review.evidence.length > 0 && (
        <div className="mb-4">
          <button 
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
            Begründung anzeigen
          </button>
          {expanded && (
            <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded border">
              {review.evidence.map((ev, i) => (
                <div key={i} className="mb-2 last:mb-0">
                  <div className="font-medium text-gray-800">{ev.signal}</div>
                  <div>{ev.explanation}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 border-t pt-4">
        <div className="mb-3 text-sm font-medium text-gray-700">Aktion bestätigen oder korrigieren:</div>
        <div className="flex flex-wrap gap-2 mb-4">
          {(['accepted', 'declined', 'change_requested', 'question', 'callback_requested', 'unclear'] as OfferResponseIntent[]).map(intent => (
            <button
              key={intent}
              onClick={() => setSelectedIntent(intent)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${
                selectedIntent === intent 
                  ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
              }`}
            >
              {getIntentIcon(intent)}
              {getIntentLabel(intent)}
            </button>
          ))}
        </div>
        
        <div className="flex justify-end gap-2">
          <button
            onClick={() => onConfirm(selectedIntent)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {selectedIntent === review.detectedIntent ? 'Annahme bestätigen' : 'Interpretation korrigieren'}
          </button>
        </div>
      </div>
    </div>
  );
};
