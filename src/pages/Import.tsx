import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileSpreadsheet, ArrowRight, Check, AlertCircle, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBuildings } from '@/hooks/useBuildings';
import { useBuildingsStore } from '@/lib/store';
import { recalculateBuildingScore } from '@/lib/scoring';
import type { Building, PipelineStage } from '@/types';
import toast from 'react-hot-toast';

type ImportStep = 'upload' | 'mapping' | 'preview' | 'complete';

const SCOUT_FIELDS = [
  { key: 'address', label: 'Address', required: true },
  { key: 'name', label: 'Building Name' },
  { key: 'borough', label: 'Borough' },
  { key: 'region', label: 'Region/Neighborhood' },
  { key: 'units', label: 'Unit Count' },
  { key: 'type', label: 'Building Type' },
  { key: 'year_built', label: 'Year Built' },
  { key: 'current_management', label: 'Current Management' },
  { key: 'contacts_name', label: 'Contact Name' },
  { key: 'contacts_role', label: 'Contact Role' },
  { key: 'contacts_phone', label: 'Contact Phone' },
  { key: 'contacts_email', label: 'Contact Email' },
  { key: 'violations_count', label: 'Violations Count' },
  { key: 'market_value', label: 'Market Value' },
  { key: 'notes', label: 'Notes' },
];

export default function Import() {
  const navigate = useNavigate();
  const { saveBuildingToSupabase } = useBuildings();
  const addBuildings = useBuildingsStore((s) => s.addBuildings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ImportStep>('upload');
  const [fileName, setFileName] = useState('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [importStage, setImportStage] = useState<PipelineStage>('discovered');
  const [isImporting, setIsImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const parseCSV = (text: string): { headers: string[]; rows: Record<string, string>[] } => {
    const lines = text.split('\n').filter((l) => l.trim());
    if (lines.length < 2) return { headers: [], rows: [] };

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = values[i] || '';
      });
      return row;
    });

    return { headers, rows };
  };

  const handleFile = useCallback((file: File) => {
    if (!file.name.match(/\.(csv|tsv|txt)$/i)) {
      toast.error('Please upload a CSV file');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSV(text);
      setCsvHeaders(headers);
      setCsvData(rows);

      // Auto-map fields by name similarity
      const autoMap: Record<string, string> = {};
      SCOUT_FIELDS.forEach((field) => {
        const match = headers.find(
          (h) =>
            h.toLowerCase().includes(field.key.replace('_', ' ')) ||
            h.toLowerCase().includes(field.label.toLowerCase()) ||
            h.toLowerCase() === field.key
        );
        if (match) autoMap[field.key] = match;
      });
      setFieldMapping(autoMap);

      setStep('mapping');
      toast.success(`Loaded ${rows.length} rows from ${file.name}`);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const runImport = () => {
    setIsImporting(true);
    const buildings: Building[] = csvData.map((row) => {
      const getVal = (fieldKey: string) => {
        const csvCol = fieldMapping[fieldKey];
        return csvCol ? row[csvCol] : '';
      };

      const building: Partial<Building> = {
        id: crypto.randomUUID(),
        address: getVal('address') || 'Unknown Address',
        name: getVal('name') || undefined,
        borough: getVal('borough') || undefined,
        region: getVal('region') || undefined,
        units: getVal('units') ? parseInt(getVal('units')) : undefined,
        type: (getVal('type') as any) || 'other',
        year_built: getVal('year_built') ? parseInt(getVal('year_built')) : undefined,
        current_management: getVal('current_management') || undefined,
        violations_count: getVal('violations_count') ? parseInt(getVal('violations_count')) : 0,
        open_violations_count: 0,
        market_value: getVal('market_value') ? parseFloat(getVal('market_value').replace(/[$,]/g, '')) : undefined,
        notes: getVal('notes') || undefined,
        contacts: [],
        enriched_data: {},
        signals: [],
        tags: ['imported'],
        status: 'active',
        source: 'import',
        pipeline_stage: importStage,
        pipeline_moved_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Build contact if data present
      const contactName = getVal('contacts_name');
      if (contactName) {
        building.contacts = [{
          name: contactName,
          role: getVal('contacts_role') || 'Unknown',
          phone: getVal('contacts_phone') || undefined,
          email: getVal('contacts_email') || undefined,
          source: 'import',
        }];
      }

      // Calculate score
      const { score, grade, signals } = recalculateBuildingScore(building);
      building.score = score;
      building.grade = grade;
      building.signals = signals;

      return building as Building;
    });

    addBuildings(buildings);
    setImportedCount(buildings.length);
    setStep('complete');
    setIsImporting(false);
    toast.success(`Imported ${buildings.length} buildings! Redirecting to Results...`);

    // Auto-redirect to Results after a brief delay so user sees the success state
    setTimeout(() => {
      navigate('/results');
    }, 2000);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Upload size={24} className="text-camelot-gold" /> Import Data
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload CSV files from dialers, Google Sheets, Excel exports, or any source
        </p>
      </div>

      {/* Progress Steps */}
      <div className="px-8 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          {['upload', 'mapping', 'preview', 'complete'].map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                step === s ? 'bg-camelot-gold text-white' :
                ['upload', 'mapping', 'preview', 'complete'].indexOf(step) > i ? 'bg-green-500 text-white' :
                'bg-gray-200 text-gray-500'
              )}>
                {['upload', 'mapping', 'preview', 'complete'].indexOf(step) > i ? <Check size={14} /> : i + 1}
              </div>
              <span className="text-xs capitalize hidden sm:block">{s}</span>
              {i < 3 && <ArrowRight size={14} className="text-gray-300 flex-shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={() => setIsDragging(false)}
            className={cn(
              'border-2 border-dashed rounded-2xl p-16 text-center transition-all cursor-pointer',
              isDragging ? 'border-camelot-gold bg-camelot-gold/5' : 'border-gray-300 hover:border-camelot-gold'
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
            />
            <FileSpreadsheet size={48} className={cn('mx-auto mb-4', isDragging ? 'text-camelot-gold' : 'text-gray-400')} />
            <h3 className="text-lg font-bold mb-2">Drop your CSV file here</h3>
            <p className="text-sm text-gray-500 mb-4">or click to browse</p>
            <p className="text-xs text-gray-400">Supports: CSV, TSV, TXT (comma-delimited)</p>
            <div className="flex justify-center gap-4 mt-6">
              {['Dialer Export', 'Google Sheets', 'Excel', 'Generic CSV'].map((fmt) => (
                <span key={fmt} className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">{fmt}</span>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Mapping */}
        {step === 'mapping' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold">Map Columns</h3>
                <p className="text-sm text-gray-500">Match your CSV columns to Scout fields</p>
              </div>
              <span className="text-sm text-gray-400">{csvData.length} rows • {csvHeaders.length} columns</span>
            </div>

            <div className="space-y-3">
              {SCOUT_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-48">
                    <span className="text-sm font-medium">{field.label}</span>
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </div>
                  <ArrowRight size={14} className="text-gray-400" />
                  <select
                    value={fieldMapping[field.key] || ''}
                    onChange={(e) => setFieldMapping({ ...fieldMapping, [field.key]: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50"
                  >
                    <option value="">— Skip —</option>
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  {fieldMapping[field.key] && (
                    <span className="text-xs text-gray-400 w-32 truncate">
                      e.g. "{csvData[0]?.[fieldMapping[field.key]] || '—'}"
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Import Stage */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <label className="text-sm font-medium mb-2 block">Import into pipeline stage:</label>
              <select
                value={importStage}
                onChange={(e) => setImportStage(e.target.value as PipelineStage)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="discovered">Discovered</option>
                <option value="scored">Scored</option>
                <option value="contacted">Contacted</option>
                <option value="nurture">Nurture</option>
              </select>
            </div>

            <div className="flex justify-between mt-6">
              <button onClick={() => setStep('upload')} className="text-sm text-gray-500 hover:text-gray-700">
                ← Back
              </button>
              <button
                onClick={() => setStep('preview')}
                disabled={!fieldMapping['address']}
                className="bg-camelot-gold text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-camelot-gold-dark disabled:opacity-50"
              >
                Preview Import →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && (
          <div>
            <h3 className="text-lg font-bold mb-2">Preview</h3>
            <p className="text-sm text-gray-500 mb-6">Review the first 5 rows before importing</p>

            <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {SCOUT_FIELDS.filter((f) => fieldMapping[f.key]).map((f) => (
                      <th key={f.key} className="text-left px-3 py-2 text-xs font-semibold text-gray-500">{f.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      {SCOUT_FIELDS.filter((f) => fieldMapping[f.key]).map((f) => (
                        <td key={f.key} className="px-3 py-2 text-xs truncate max-w-[150px]">
                          {row[fieldMapping[f.key]] || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-sm text-gray-500 mt-4">
              Importing {csvData.length} buildings into <strong className="capitalize">{importStage}</strong> stage.
            </p>

            <div className="flex justify-between mt-6">
              <button onClick={() => setStep('mapping')} className="text-sm text-gray-500 hover:text-gray-700">
                ← Back
              </button>
              <button
                onClick={runImport}
                disabled={isImporting}
                className="bg-camelot-gold text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-camelot-gold-dark disabled:opacity-50 flex items-center gap-2"
              >
                {isImporting ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                Import {csvData.length} Buildings
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Import Complete!</h3>
            <p className="text-gray-500 mb-6">{importedCount} buildings imported successfully</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => { setStep('upload'); setCsvData([]); setCsvHeaders([]); setFieldMapping({}); }}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
              >
                Import More
              </button>
              <button
                onClick={() => navigate('/results')}
                className="bg-camelot-gold text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-camelot-gold-dark"
              >
                View Results →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
