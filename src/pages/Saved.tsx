import { useState } from 'react';
import { Bookmark, Plus, Folder, MoreHorizontal, Share2, Trash2, Edit, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBuildings } from '@/hooks/useBuildings';
import PropertyCard from '@/components/PropertyCard';
import PropertyDetail from '@/components/PropertyDetail';
import type { Building, Folder as FolderType } from '@/types';
import toast from 'react-hot-toast';

const DEMO_FOLDERS: FolderType[] = [
  { id: '1', name: 'High Priority — UES', description: 'Upper East Side buildings with high scores', color: '#C5A55A', created_by: '1', shared_with: [], created_at: '', updated_at: '', building_count: 4 },
  { id: '2', name: 'Self-Managed Buildings', description: 'No established management — prime targets', color: '#22c55e', created_by: '1', shared_with: ['2'], created_at: '', updated_at: '', building_count: 3 },
  { id: '3', name: 'Carl\'s Call List', description: 'Buildings for cold calling this week', color: '#3b82f6', created_by: '3', shared_with: [], created_at: '', updated_at: '', building_count: 5 },
  { id: '4', name: 'Miami Pipeline', description: 'South Florida expansion targets', color: '#f59e0b', created_by: '1', shared_with: ['2', '4'], created_at: '', updated_at: '', building_count: 0 },
];

export default function Saved() {
  const { buildings, updateBuilding } = useBuildings();
  const [folders, setFolders] = useState(DEMO_FOLDERS);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [detailBuilding, setDetailBuilding] = useState<Building | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const activeBuildings = buildings.filter((b) => b.status === 'active');

  // Simulate folder contents — in real app, this would come from scout_folder_buildings
  const getFolderBuildings = (folderId: string): Building[] => {
    const idx = parseInt(folderId) - 1;
    if (idx === 0) return activeBuildings.filter((b) => b.region === 'Upper East Side' && b.score >= 75);
    if (idx === 1) return activeBuildings.filter((b) => b.current_management?.toLowerCase().includes('self') || b.current_management === 'Unknown');
    if (idx === 2) return activeBuildings.slice(0, 5);
    return [];
  };

  const createFolder = () => {
    if (!newFolderName.trim()) return;
    const folder: FolderType = {
      id: String(folders.length + 1),
      name: newFolderName,
      color: '#C5A55A',
      created_by: '1',
      shared_with: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      building_count: 0,
    };
    setFolders([...folders, folder]);
    setNewFolderName('');
    setIsCreating(false);
    toast.success('Folder created');
  };

  const deleteFolder = (id: string) => {
    setFolders(folders.filter((f) => f.id !== id));
    if (selectedFolder === id) setSelectedFolder(null);
    toast.success('Folder deleted');
  };

  const folderBuildings = selectedFolder ? getFolderBuildings(selectedFolder) : [];
  const selectedFolderData = folders.find((f) => f.id === selectedFolder);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bookmark size={24} className="text-camelot-gold" /> Saved Lists
            </h1>
            <p className="text-sm text-gray-500">{folders.length} folders</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-camelot-gold text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-camelot-gold-dark transition-colors"
          >
            <Plus size={16} /> New Folder
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-140px)]">
        {/* Folder Sidebar */}
        <div className="w-80 border-r border-gray-200 bg-white overflow-y-auto">
          {isCreating && (
            <div className="p-4 border-b border-gray-100">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createFolder()}
                placeholder="Folder name..."
                autoFocus
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50"
              />
              <div className="flex gap-2 mt-2">
                <button onClick={createFolder} className="text-xs bg-camelot-gold text-white px-3 py-1.5 rounded-lg">Create</button>
                <button onClick={() => setIsCreating(false)} className="text-xs text-gray-500 px-3 py-1.5">Cancel</button>
              </div>
            </div>
          )}

          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolder(folder.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left',
                selectedFolder === folder.id && 'bg-camelot-gold/5 border-l-2 border-l-camelot-gold'
              )}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: folder.color + '20', color: folder.color }}
              >
                <Folder size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{folder.name}</p>
                <p className="text-xs text-gray-400">{folder.building_count || getFolderBuildings(folder.id).length} buildings</p>
              </div>
              {folder.shared_with?.length > 0 && (
                <Share2 size={12} className="text-gray-400 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* Folder Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedFolder && selectedFolderData ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">{selectedFolderData.name}</h2>
                  {selectedFolderData.description && (
                    <p className="text-sm text-gray-500">{selectedFolderData.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1 text-xs text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">
                    <Share2 size={13} /> Share
                  </button>
                  <button
                    onClick={() => deleteFolder(selectedFolder)}
                    className="flex items-center gap-1 text-xs text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>

              {folderBuildings.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Folder size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="font-medium">This folder is empty</p>
                  <p className="text-sm mt-1">Drag properties here from the Results page</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {folderBuildings.map((building) => (
                    <PropertyCard
                      key={building.id}
                      building={building}
                      onViewDetails={() => setDetailBuilding(building)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-24 text-gray-400">
              <Bookmark size={64} className="mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-bold text-gray-500 mb-2">Select a folder</h3>
              <p className="text-sm">Choose a folder from the sidebar to view its properties</p>
            </div>
          )}
        </div>
      </div>

      {detailBuilding && (
        <PropertyDetail
          building={detailBuilding}
          onClose={() => setDetailBuilding(null)}
          onUpdate={updateBuilding}
        />
      )}
    </div>
  );
}
