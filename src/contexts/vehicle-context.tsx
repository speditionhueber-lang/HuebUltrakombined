import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Vehicle {
  id: string;
  name: string;        // e.g. "LKW 3,5t Koffer"
  licensePlate: string;// e.g. "W-74219 A"
  type: string;        // e.g. "3,5t LKW", "7,5t LKW", "Transporter", "Außenaufzug"
  capacityM3?: number; // e.g. 35
  notes?: string;
}

export const defaultVehicles: Vehicle[] = [
  {
    id: 'veh_1',
    name: 'LKW 3,5t Koffer',
    licensePlate: 'W-74219 A',
    type: '3,5t LKW',
    capacityM3: 35,
    notes: 'Inkl. Ladebordwand & Möbeldecken'
  },
  {
    id: 'veh_2',
    name: 'LKW 7,5t Plane',
    licensePlate: 'W-91823 B',
    type: '7,5t LKW',
    capacityM3: 50,
    notes: 'Fernverkehr & große Umzüge'
  },
  {
    id: 'veh_3',
    name: 'Sprinter Transporter',
    licensePlate: 'W-33102 C',
    type: 'Transporter',
    capacityM3: 18,
    notes: 'Express & Kleintransporte'
  },
  {
    id: 'veh_4',
    name: 'Möbellift / Außenaufzug',
    licensePlate: 'W-55412 D',
    type: 'Außenaufzug',
    capacityM3: 0,
    notes: 'Reichweite bis 26m (7. Stock)'
  }
];

interface VehicleContextType {
  vehicles: Vehicle[];
  addVehicle: (veh: Vehicle) => void;
  updateVehicle: (id: string, updated: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export const VehicleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('app_vehicles');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return defaultVehicles;
  });

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('app_vehicles', JSON.stringify(vehicles));
      } catch (e) {
        console.warn('Could not save vehicles to localStorage:', e);
      }
    }
  }, [vehicles]);

  const addVehicle = (veh: Vehicle) => {
    setVehicles(prev => [...prev, veh]);
  };

  const updateVehicle = (id: string, updated: Partial<Vehicle>) => {
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...updated } : v));
  };

  const deleteVehicle = (id: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
  };

  return (
    <VehicleContext.Provider value={{ vehicles, addVehicle, updateVehicle, deleteVehicle }}>
      {children}
    </VehicleContext.Provider>
  );
};

export const useVehicle = () => {
  const context = useContext(VehicleContext);
  if (context === undefined) {
    // Graceful fallback for components used outside Provider
    return {
      vehicles: defaultVehicles,
      addVehicle: () => {},
      updateVehicle: () => {},
      deleteVehicle: () => {}
    };
  }
  return context;
};
