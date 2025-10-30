import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import styles from './ManageRatesPage.module.css';
import toast, { Toaster } from 'react-hot-toast';

const RATES_DOC_REF = doc(db, 'config', 'print_rates');

function ManageRatesPage() {
  const [rates, setRates] = useState({
    perPageBw: '',
    perPageColor: '',
    doubleSidedMultiplier: '',
    staplingFee: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const docSnap = await getDoc(RATES_DOC_REF);
        if (docSnap.exists()) {
          setRates(docSnap.data());
        } else {
          console.log("No rate document found. Using default values.");
        }
      } catch (error) {
        toast.error("Failed to fetch current rates.");
      }
      setLoading(false);
    };
    fetchRates();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRates(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ratesToSave = {
      perPageBw: Number(rates.perPageBw),
      perPageColor: Number(rates.perPageColor),
      doubleSidedMultiplier: Number(rates.doubleSidedMultiplier),
      staplingFee: Number(rates.staplingFee),
    };

    try {
      // setDoc with merge:true will create or update the document
      await setDoc(RATES_DOC_REF, ratesToSave, { merge: true });
      toast.success("Printing rates have been updated successfully!");
    } catch (error) {
      console.error("Error updating rates: ", error);
      toast.error("Failed to update rates. Check permissions.");
    }
  };
  
  if (loading) return <p className="flex items-center justify-center font-bold text-3xl h-screen w-screen">Loading Rates...</p>;

  return (
    <div className={"pb-16"}>
      <Toaster position="top-center" />
      <h1 className='text-center font-bold text-3xl my-4'>Manage V-Print Rates</h1>
      <form onSubmit={handleSubmit} className={"card m-4 p-2 text-secondary font-bold text-lg"}>
        <div className={""}>
          <label className="" htmlFor="perPageBw">Cost per B&W Page (₹)</label>
          <input className="mt-2 mb-4 form-input" id="perPageBw" name="perPageBw" type="number" step="0.01" value={rates.perPageBw} onChange={handleChange} required />
        </div>
        <div className={""}>
          <label className="" htmlFor="perPageColor">Cost per Color Page (₹)</label>
          <input className="mt-2 mb-4 form-input" id="perPageColor" name="perPageColor" type="number" step="0.01" value={rates.perPageColor} onChange={handleChange} required />
        </div>
        <div className={""}>
          <label className="" htmlFor="doubleSidedMultiplier">Double-Sided Multiplier</label>
          <input className="mt-2 mb-4 form-input" id="doubleSidedMultiplier" name="doubleSidedMultiplier" type="number" step="0.01" value={rates.doubleSidedMultiplier} onChange={handleChange} required />
        </div>
        <div className={""}>
          <label className="" htmlFor="staplingFee">Stapling Fee (₹)</label>
          <input className="mt-2 mb-4 form-input" id="staplingFee" name="staplingFee" type="number" step="0.01" value={rates.staplingFee} onChange={handleChange} required />
        </div>
        <button type="submit" className={"flex flex-col items-center p-4 bg-primary rounded-lg text-white font-bold w-full"}>Save Rates</button>
      </form>
    </div>
  );
}

export default ManageRatesPage;