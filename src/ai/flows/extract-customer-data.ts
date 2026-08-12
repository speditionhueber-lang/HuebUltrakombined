export interface ExtractCustomerDataOutput {
  name?: string;
  email?: string;
  phone?: string;
  abholadresse?: {
    strasse?: string;
    stockwerk?: string;
    aufzug?: string;
    gebaeudetyp?: string;
  };
  zieladresse?: {
    strasse?: string;
    stockwerk?: string;
    aufzug?: string;
    gebaeudetyp?: string;
  };
  umzugsdetails?: {
    gewuenschterUmzugstermin?: string;
    voraussichtlicheStartzeit?: string;
  };
  gegenstaende?: Record<string, number | string>;
  anmerkungen?: string;
}
