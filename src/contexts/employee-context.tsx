import React, { createContext, useContext, useState, useEffect } from 'react';
import { employees as initialEmployees, Employee } from '@/src/lib/mitarbeiter-data';

interface EmployeeContextType {
  employees: Employee[];
  addEmployee: (emp: Employee) => void;
  updateEmployee: (id: string, updated: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const EmployeeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem("app_employees");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return initialEmployees;
  });

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem("app_employees", JSON.stringify(employees));
      } catch (e) {
        console.warn('Could not save app_employees to localStorage:', e);
      }
    }
  }, [employees]);

  const addEmployee = (emp: Employee) => {
    setEmployees(prev => [...prev, emp]);
  };

  const updateEmployee = (id: string, updated: Partial<Employee>) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updated } : e));
  };

  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  return (
    <EmployeeContext.Provider value={{ employees, addEmployee, updateEmployee, deleteEmployee }}>
      {children}
    </EmployeeContext.Provider>
  );
};

export const useEmployee = () => {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    return {
      employees: initialEmployees,
      addEmployee: () => {},
      updateEmployee: () => {},
      deleteEmployee: () => {}
    };
  }
  return context;
};
