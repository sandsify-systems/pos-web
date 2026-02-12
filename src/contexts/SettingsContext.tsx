
'use client';

import React, { createContext, useContext, useEffect, useState } from "react";

interface SettingsContextType {
  enableTables: boolean;
  enableDrafts: boolean;
  enableTax: boolean;
  taxRate: number;
  printerPaperSize: '58mm' | '80mm';
  autoPrint: boolean;
  printerType: 'browser' | 'network';
  printerIp: string;
  inactivityTimeout: number; // in minutes, 0 for never
  toggleTables: () => void;
  toggleDrafts: () => void;
  toggleTax: () => void;
  updateTaxRate: (rate: number) => void;
  updatePrinterSettings: (settings: {
    paperSize?: '58mm' | '80mm';
    autoPrint?: boolean;
    type?: 'browser' | 'network';
    ip?: string;
  }) => void;
  updateInactivityTimeout: (minutes: number) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [enableTables, setEnableTables] = useState(false);
  const [enableDrafts, setEnableDrafts] = useState(true);
  const [enableTax, setEnableTax] = useState(false);
  const [taxRate, setTaxRate] = useState(0);

  const [printerPaperSize, setPrinterPaperSize] = useState<'58mm' | '80mm'>('80mm');
  const [autoPrint, setAutoPrint] = useState(false);
  const [printerType, setPrinterType] = useState<'browser' | 'network'>('browser');
  const [printerIp, setPrinterIp] = useState('');
  const [inactivityTimeout, setInactivityTimeout] = useState(30); // Default 30 mins

  useEffect(() => {
    const tables = localStorage.getItem("enableTables");
    const drafts = localStorage.getItem("enableDrafts");
    const tax = localStorage.getItem("enableTax");
    const rate = localStorage.getItem("taxRate");

    const pSize = localStorage.getItem("printerPaperSize") as '58mm' | '80mm';
    const pAuto = localStorage.getItem("autoPrint");
    const pType = localStorage.getItem("printerType") as 'browser' | 'network';
    const pIp = localStorage.getItem("printerIp");
    const timeout = localStorage.getItem("inactivityTimeout");
    
    setEnableTables(tables === "true");
    // Default to true if not set
    setEnableDrafts(drafts === null ? true : drafts === "true");
    setEnableTax(tax === "true");
    setTaxRate(rate ? parseFloat(rate) : 0);

    if (pSize) setPrinterPaperSize(pSize);
    if (pAuto) setAutoPrint(pAuto === "true");
    if (pType) setPrinterType(pType);
    if (pIp) setPrinterIp(pIp);
    if (timeout) setInactivityTimeout(parseInt(timeout));
  }, []);

  const toggleTables = () => {
    const newValue = !enableTables;
    setEnableTables(newValue);
    localStorage.setItem("enableTables", String(newValue));
  };

  const toggleDrafts = () => {
    const newValue = !enableDrafts;
    setEnableDrafts(newValue);
    localStorage.setItem("enableDrafts", String(newValue));
  };

  const toggleTax = () => {
    const newValue = !enableTax;
    setEnableTax(newValue);
    localStorage.setItem("enableTax", String(newValue));
  };

  const updateTaxRate = (rate: number) => {
    setTaxRate(rate);
    localStorage.setItem("taxRate", String(rate));
  };

  const updatePrinterSettings = (settings: {
    paperSize?: '58mm' | '80mm';
    autoPrint?: boolean;
    type?: 'browser' | 'network';
    ip?: string;
  }) => {
    if (settings.paperSize) {
      setPrinterPaperSize(settings.paperSize);
      localStorage.setItem("printerPaperSize", settings.paperSize);
    }
    if (settings.autoPrint !== undefined) {
      setAutoPrint(settings.autoPrint);
      localStorage.setItem("autoPrint", String(settings.autoPrint));
    }
    if (settings.type) {
      setPrinterType(settings.type);
      localStorage.setItem("printerType", settings.type);
    }
    if (settings.ip !== undefined) {
      setPrinterIp(settings.ip);
      localStorage.setItem("printerIp", settings.ip);
    }
  };

  const updateInactivityTimeout = (minutes: number) => {
    setInactivityTimeout(minutes);
    localStorage.setItem("inactivityTimeout", String(minutes));
  };

  return (
    <SettingsContext.Provider
      value={{
        enableTables,
        enableDrafts,
        enableTax,
        taxRate,
        printerPaperSize,
        autoPrint,
        printerType,
        printerIp,
        inactivityTimeout,
        toggleTables,
        toggleDrafts,
        toggleTax,
        updateTaxRate,
        updatePrinterSettings,
        updateInactivityTimeout,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
