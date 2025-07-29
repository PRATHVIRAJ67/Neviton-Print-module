import { useEffect, useState } from 'react';
import { Printer, Upload } from 'lucide-react';
import axios from 'axios';

export default function Print() {
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadPrinters();
  }, []);

  const loadPrinters = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/printers');
      const printersData = Array.isArray(response.data) ? response.data : [];
      setPrinters(printersData);
      if (printersData.length > 0) {
        setSelectedPrinter(printersData[0].name);
      }
    } catch (error) {
      console.error('Failed to load printers:', error);
      setMessage('Failed to load printers');
      setPrinters([]); 
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setMessage('');
    } else {
      setMessage('Please select a PDF file');
    }
  };

  const handlePrint = async () => {
    if (!selectedPrinter || !selectedFile) {
      setMessage('Please select both a printer and file');
      return;
    }

    setLoading(true);
    try {
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      const uploadResponse = await axios.post('http://localhost:4000/api/upload', formData);
      
      
      await axios.post('http://localhost:4000/api/print', {
        printer: selectedPrinter,
        filePath: uploadResponse.data.filePath
      });

      setMessage('Document printed successfully!');
      setSelectedFile(null);
    } catch (error) {
      console.error('Failed to print document:', error);
      setMessage('Failed to print document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
      <div className="text-center mb-6">
        <Printer className="mx-auto h-8 w-8 text-blue-600 mb-2" />
        <h1 className="text-xl font-bold">Print Package Manager</h1>
      </div>

      {/* File Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">PDF File</label>
        <div className="relative">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="w-full p-2 border rounded-md"
          />
          {selectedFile && (
            <p className="text-sm text-green-600 mt-1">{selectedFile.name}</p>
          )}
        </div>
      </div>

      {/* Printer Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2"></label>
        <select
          value={selectedPrinter}
          onChange={(e) => setSelectedPrinter(e.target.value)}
          className="w-full p-2 border rounded-md"
        >
          <option value="">Select printer...</option>
          {Array.isArray(printers) && printers.map((printer) => (
            <option key={printer.name} value={printer.name}>
              {printer.name}
            </option>
          ))}
        </select>
      </div>

      {/* Message */}
      {message && (
        <div className="mb-4 p-2 text-sm rounded-md bg-gray-100">
          {message}
        </div>
      )}

      {/* Print Button */}
      <button
        onClick={handlePrint}
        disabled={!selectedFile || !selectedPrinter || loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-md"
      >
        {loading ? 'Printing...' : 'Print'}
      </button>
    </div>
  );
}