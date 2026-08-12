import { apiFetch } from "@/src/lib/api-client";
import { CustomerWorkflowState } from "@/contexts/customer-context";
import { Customer } from "./types";

export interface AISuggestion {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Analyzes the current customer state and provides proactive suggestions via backend.
 */
export async function getSmartSuggestions(
  customer: Customer,
  state: CustomerWorkflowState
): Promise<AISuggestion[]> {
  try {
    const response = await apiFetch('/api/ai/get-smart-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ customer, state })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("AI Service Error:", error);
    return getMockSuggestions(customer, state);
  }
}

function getMockSuggestions(customer: Customer, state: CustomerWorkflowState): AISuggestion[] {
  const suggestions: AISuggestion[] = [];

  if (state.offerData && state.offerData.totalM3 > 0 && state.highlightedNav['/angebot'] === 'pending') {
    suggestions.push({
      title: "Angebot erstellen",
      description: `Das Volumen für ${customer.name} wurde berechnet (${state.offerData.totalM3} m³). Es wurde jedoch noch kein offizielles Angebot erstellt.`,
      actionLabel: "Zum Angebot",
      actionHref: "/angebot",
      priority: "high"
    });
  }

  if (state.pendingApproval) {
    suggestions.push({
      title: "Kunden kontaktieren",
      description: `${customer.name} hat ein Angebot erhalten, aber noch nicht reagiert. Ein kurzer Anruf könnte die Entscheidung beschleunigen.`,
      actionLabel: "Telefonnummer anzeigen",
      actionHref: "/customers",
      priority: "medium"
    });
  }

  if (state.areInvoicesPaid === false && state.highlightedNav['/rechnung-erstellen'] === 'completed') {
    suggestions.push({
      title: "Zahlungseingang prüfen",
      description: `Der Umzug für ${customer.name} ist abgeschlossen. Prüfe, ob die Zahlung bereits auf dem Konto eingegangen ist.`,
      actionLabel: "Rechnungen öffnen",
      actionHref: "/finanzen",
      priority: "medium"
    });
  }

  return suggestions.slice(0, 2);
}
