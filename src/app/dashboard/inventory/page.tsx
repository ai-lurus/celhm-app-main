'use client'

import { useState, useEffect } from 'react'
import { useStock, useCreateInventoryItem, useUpdateInventoryItem, useDeleteInventoryItem, InventoryItem } from '../../../lib/hooks/useStock'
import { useCreateMovement } from '../../../lib/hooks/useMovements'
import { useCategories, useBrands } from '../../../lib/hooks/useCatalog'
import { useAuthStore } from '../../../stores/auth'
import { usePermissions } from '../../../lib/hooks/usePermissions'

//-------------
// ICONOS
//-------------
const IconEdit = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);
const IconMovement = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
  </svg>
);
const IconDelete = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.54 0c-.27 0-.537.019-.804.055l-3.478.397m14.456 0l-3.478-.397m-12.54 0l3.478-.397m9.064 0l-3.478-.397M9.26 9v9.969" />
  </svg>
);
const IconUpload = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);
const IconDownload = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 12.75l4.5-4.5m-4.5 4.5l-4.5-4.5M12 12.75V3" />
  </svg>
);
const IconPlus = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);
const IconChevronDown = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

//-----------------
// TIPOS DE DATOS
//-----------------
interface Category {
  id: number;
  name: string;
  children?: Category[];
}
interface Brand {
  label: string;
  value: string;
}
// InventoryItem is now imported from useStock hook
interface NewProductForm {
  name: string;
  brand: string;
  price: number;
  purchasePrice: number;
  barcode: string;
  sku: string;
  initial_stock: number;
  min_stock: number;
}

// Removed filtersData mock - now using API (useCategories and useBrands hooks)

const newProductInitialState: NewProductForm = {
  name: '',
  brand: '',
  price: 0,
  purchasePrice: 0,
  barcode: '',
  sku: '',
  initial_stock: 10,
  min_stock: 5,
};

// Removed initialInventory - now using API

const CSV_TEMPLATE_HEADERS = "sku,name,brand,model,qty,min,max,price,status,categoryId";

export default function InventoryPage() {
  const user = useAuthStore((state) => state.user);
  const { can } = usePermissions();
  
  // --- estados de filtros y paginacion ---
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [modelSearch, setModelSearch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<'normal' | 'low' | 'critical' | ''>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);

  // API hooks
  const { data: stockData, isLoading, error, refetch } = useStock({
    marca: selectedBrand || undefined,
    modelo: modelSearch || undefined,
    estado: selectedStatus || undefined,
    categoriaId: filterCategory || undefined,
    page: currentPage,
    pageSize: itemsPerPage,
  });

  const createItem = useCreateInventoryItem();
  const updateItem = useUpdateInventoryItem();
  const deleteItem = useDeleteInventoryItem();
  const createMovement = useCreateMovement();

  // Get categories and brands from API
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();

  // --- estados de modales ---
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [newProduct, setNewProduct] = useState<NewProductForm>(newProductInitialState);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  const [isMovementModalOpen, setIsMovementModalOpen] = useState<boolean>(false);
  const [itemForMovement, setItemForMovement] = useState<InventoryItem | null>(null);
  const [movementType, setMovementType] = useState<'entrada' | 'salida'>('entrada');
  const [movementQuantity, setMovementQuantity] = useState<number>(1);

  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<string>('');

  // --- estado para el Dropdown del boton "acciones" (NUEVO) ---
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);

  // Get inventory items from API
  const inventoryItems = stockData?.data || [];
  const pagination = stockData?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 };
  
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBrand, modelSearch, selectedStatus, filterCategory, itemsPerPage]);

  //---------------------
  // LOGICA DE FUNCIONES
  //----------------------

  // Simplified category handling - using flat list from API

  // --- Gestion de productos (agregar/editar) ---
  const openAddModal = () => {
    setItemToEdit(null);
    setNewProduct(newProductInitialState);
    setSelectedCategory('');
    setIsModalOpen(true);
    setShowActionsDropdown(false);
  };

  const openEditModal = (item: InventoryItem) => {
    setItemToEdit(item);
    setNewProduct({
      name: item.name,
      brand: item.brand,
      price: item.price,
      purchasePrice: (item as any).purchasePrice || 0,
      barcode: (item as any).barcode || '',
      sku: item.sku,
      initial_stock: item.qty,
      min_stock: item.min,
    });
    // Note: categoryId is not directly available in InventoryItem, would need to get from variant.product.category
    setSelectedCategory('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setItemToEdit(null);
    setNewProduct(newProductInitialState);
    setSelectedCategory('');
  };


  const renderCategorySelectors = () => {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700">Categoría</label>
        <select 
          onChange={(e) => setSelectedCategory(e.target.value)} 
          value={selectedCategory} 
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
        >
          <option value="">Selecciona una categoría</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
    );
  };

  const handleSaveProduct = async () => {
    if (!newProduct.name) {
      alert('Por favor, completa el nombre.');
      return;
    }
    
    try {
      if (itemToEdit) {
        await updateItem.mutateAsync({
          id: itemToEdit.id,
          data: {
            name: newProduct.name,
            brand: newProduct.brand,
            price: newProduct.price,
            purchasePrice: newProduct.purchasePrice || undefined,
            barcode: newProduct.barcode || undefined,
            sku: newProduct.sku,
            initial_stock: newProduct.initial_stock,
            min_stock: newProduct.min_stock,
            max_stock: 100,
          },
        });
      } else {
        await createItem.mutateAsync({
          branchId: user?.branchId,
          name: newProduct.name,
          brand: newProduct.brand,
          model: 'Nuevo Modelo',
          sku: newProduct.sku || undefined,
          price: newProduct.price,
          purchasePrice: newProduct.purchasePrice || undefined,
          barcode: newProduct.barcode || undefined,
          qty: newProduct.initial_stock,
          min: newProduct.min_stock,
          max: 100,
          // Note: category is not part of CreateInventoryItemDto, it's set on the product
        });
      }
      closeModal();
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.message || error.message || 'Error al guardar'}`);
    }
  };

  // Simplified category filtering - using flat list from API

  const renderPageFilterSelectors = () => {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
        <select 
          onChange={(e) => setFilterCategory(e.target.value)} 
          value={filterCategory} 
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
    );
  };

  // --- eliminar ---
  const openDeleteModal = (item: InventoryItem) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setItemToDelete(null);
    setIsDeleteModalOpen(false);
  };
  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      try {
        await deleteItem.mutateAsync(itemToDelete.id);
        closeDeleteModal();
      } catch (error: any) {
        alert(`Error: ${error.response?.data?.message || error.message || 'Error al eliminar'}`);
      }
    }
  };

  // --- movimiento ---
  const openMovementModal = (item: InventoryItem) => {
    setItemForMovement(item);
    setMovementQuantity(1);
    setMovementType('entrada');
    setIsMovementModalOpen(true);
  };
  const closeMovementModal = () => {
    setIsMovementModalOpen(false);
    setItemForMovement(null);
  };
  const handleSaveMovement = async () => {
    if (movementQuantity <= 0) {
      alert('La cantidad debe ser mayor a 0.');
      return;
    }
    if (!itemForMovement || !user?.branchId) {
      alert('Error: No se puede registrar el movimiento.');
      return;
    }

    // Check if salida would result in negative stock
    if (movementType === 'salida' && itemForMovement.qty - movementQuantity < 0) {
      alert('Error: No se puede registrar una salida que deje el stock en negativo.');
      return;
    }

    try {
      await createMovement.mutateAsync({
        branchId: user.branchId,
        variantId: itemForMovement.variantId,
        type: movementType,
        qty: movementQuantity,
      });
      closeMovementModal();
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.message || error.message || 'Error al registrar movimiento'}`);
    }
  };

  // --- exportar csv ---
  const handleExportCSV = () => {
    const headers = ["id", "sku", "name", "brand", "model", "qty", "min", "max", "reserved", "price", "status", "categoryId"];
    const data = inventoryItems.map((item:InventoryItem) => [
      item.id, item.sku, `"${item.name.replace(/"/g, '""')}"`, 
      item.brand, item.model, item.qty, item.min, item.max, item.reserved, item.price, item.status, item.categoryId
    ].join(','));
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n" + data.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventario_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowActionsDropdown(false);
  };

  // --- iportarr csv ---
  const openImportModal = () => {
    setIsImportModalOpen(true);
    setCsvFile(null);
    setImportStatus('');
    setShowActionsDropdown(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
      setImportStatus('');
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," + CSV_TEMPLATE_HEADERS;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `plantilla_importacion_inventario.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProcessImport = () => {
    if (!csvFile) {
      setImportStatus('Error: No se ha seleccionado ningún archivo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== ''); 
        if (lines.length <= 1) throw new Error("El archivo está vacío o no tiene datos.");
        const headers = lines[0].split(',').map(h => h.trim());
        const requiredHeaders = CSV_TEMPLATE_HEADERS.split(',');
        for(const header of requiredHeaders) {
          if (!headers.includes(header)) throw new Error(`Error: Falta columna "${header}".`);
        }
        
        const newItems: InventoryItem[] = [];
        let maxId = Math.max(0, ...inventoryItems.map((i:InventoryItem) => i.id));

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          if (values.length !== headers.length) continue;
          
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index].trim().replace(/"/g, '');
          });

          const qty = parseInt(obj.qty) || 0;
          const min = parseInt(obj.min) || 0;
          const newItem: InventoryItem = {
            id: ++maxId,
            variantId: maxId, // Use same ID as temporary variantId for import
            sku: obj.sku || `SKU-${Date.now() + i}`,
            name: obj.name,
            brand: obj.brand,
            model: obj.model,
            qty: qty,
            min: min,
            max: parseInt(obj.max) || 100,
            reserved: parseInt(obj.reserved) || 0,
            price: parseFloat(obj.price) || 0,
            status: qty <= min ? (qty <= 0 ? 'critical' : 'low') : 'normal',
            categoryId: parseInt(obj.categoryId) || 0,
          };
          if (newItem.name && newItem.categoryId) newItems.push(newItem);
        }
        
        // Create items via API
        let successCount = 0;
        for (const item of newItems) {
          try {
            await createItem.mutateAsync({
              name: item.name,
              brand: item.brand,
              model: item.model,
              sku: item.sku,
              price: item.price,
              qty: item.qty,
              min: item.min,
              max: item.max,
            });
            successCount++;
          } catch (err) {
            console.error('Error creating item:', err);
          }
        }
        
        // Refetch inventory to show new items
        await refetch();
        
        setImportStatus(`¡Éxito! Se importaron ${successCount} de ${newItems.length} productos.`);
        setCsvFile(null);
        setIsImportModalOpen(false);
      } catch (error: any) {
        setImportStatus(`Error: ${error.message}`);
      }
    };
    reader.readAsText(csvFile);
  };
  
  // Filtering and pagination now handled by backend API
  const paginatedInventory = inventoryItems;
  const totalItems = pagination.total;
  const totalPages = pagination.totalPages;
  const startIndex = (pagination.page - 1) * pagination.pageSize;
  const endIndex = Math.min(startIndex + pagination.pageSize, totalItems);

  return (
    <div className="space-y-6">
      
      {/* --- encabezado con menu --- */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600">Gestión de stock por sucursal</p>
        </div>
        
        {/* boton de acciones con menu */}
        <div className="relative">
          {/* boton principal */}
          <button 
            onClick={() => setShowActionsDropdown(!showActionsDropdown)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 focus:outline-none"
          >
            <span>Agregar Producto</span>
            <IconChevronDown className="w-4 h-4" />
          </button>

          {/* menu desplegable */}
          {showActionsDropdown && (
            <>
              {/* backdrop invisible para cerrar al hacer clic fuera */}
              <div 
                className="fixed inset-0 z-10 cursor-default" 
                onClick={() => setShowActionsDropdown(false)}
              ></div>
              
              {/* opciones */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200 overflow-hidden">
                <button
                  onClick={openAddModal}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <IconPlus className="w-4 h-4 text-gray-500" />
                  <span>Agregar Manualmente</span>
                </button>
                <button
                  onClick={openImportModal}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 border-t border-gray-100"
                >
                  <IconUpload className="w-4 h-4 text-gray-500" />
                  <span>Importar CSV</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <IconDownload className="w-4 h-4 text-gray-500" />
                  <span>Exportar CSV</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* --- layout de 2 columnas --- */}
      <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
        
        {/* --- sidebar filtros --- */}
        <div className="w-full md:w-1/4">
          <div className="bg-white p-4 rounded-lg shadow space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Filtros</h3>
            <div className="space-y-2">{renderPageFilterSelectors()}</div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2">
                <option value="">Todas las marcas</option>
                {brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
              <input value={modelSearch} onChange={(e) => setModelSearch(e.target.value)} type="text" placeholder="Buscar modelo..." className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as 'normal' | 'low' | 'critical' | '')} className="w-full border border-gray-300 rounded-md px-3 py-2">
                <option value="">Todos los estados</option>
                <option value="normal">Normal</option>
                <option value="low">Bajo</option>
                <option value="critical">Crítico</option>
              </select>
            </div>
          </div>
        </div>

        {/* --- tabla --- */}
        <div className="w-full md:w-3/4">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {isLoading && (
              <div className="p-8 text-center text-gray-500">Cargando inventario...</div>
            )}
            {error && (
              <div className="p-8 text-center text-red-500">
                Error al cargar inventario: {
                  error instanceof Error 
                    ? error.message 
                    : (error as any)?.response?.data?.message 
                    ? (error as any).response.data.message
                    : (error as any)?.message 
                    ? (error as any).message
                    : 'Error desconocido'
                }
              </div>
            )}
            {!isLoading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reservado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mín/Máx</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedInventory.map((item:InventoryItem) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.brand} - {item.model}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.sku}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.qty}</div>
                        <div className="text-sm text-gray-500">Disp: {item.qty - item.reserved}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.reserved}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.min} / {item.max}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.price.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.status === 'critical' ? 'bg-red-100 text-red-800' : item.status === 'low' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                          {item.status === 'critical' ? 'Crítico' : item.status === 'low' ? 'Bajo' : 'Normal'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          {can('canEditPrices') && (
                            <button onClick={() => openEditModal(item)} title="Editar" className="p-1 rounded-md text-blue-600 hover:bg-blue-100 hover:text-blue-800 transition-colors"><IconEdit className="w-5 h-5" /></button>
                          )}
                          <button onClick={() => openMovementModal(item)} title="Movimiento" className="p-1 rounded-md text-green-600 hover:bg-green-100 hover:text-green-800 transition-colors"><IconMovement className="w-5 h-5" /></button>
                          {can('canDeleteOrders') && (
                            <button onClick={() => openDeleteModal(item)} title="Eliminar" className="p-1 rounded-md text-red-600 hover:bg-red-100 hover:text-red-800 transition-colors"><IconDelete className="w-5 h-5" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
            
            {/* --- paginacion --- */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1 || isLoading} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Anterior</button>
                <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages || isLoading} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Siguiente</button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{totalItems > 0 ? startIndex + 1 : 0}</span> a <span className="font-medium">{Math.min(endIndex, totalItems)}</span> de <span className="font-medium">{totalItems}</span> resultados
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <label htmlFor="itemsPerPage" className="text-sm text-gray-700">Items por pág:</label>
                  <select id="itemsPerPage" value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="border border-gray-300 rounded-md px-2 py-1 text-sm">
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1 || isLoading} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">Anterior</button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      Pág {pagination.page} de {totalPages || 1}
                    </span>
                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages || totalPages === 0 || isLoading} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">Siguiente</button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* --- Modales --- */}
      
      {/* agregar/editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-4xl max-h-full overflow-y-auto space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">{itemToEdit ? 'Editar Producto' : 'Agregar Nuevo Producto'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700">Nombre</label><input type="text" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Marca</label>
                  <select value={newProduct.brand} onChange={e => setNewProduct({ ...newProduct, brand: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                    <option value="">Selecciona una marca</option>
                    {brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700">Precio de Venta</label><input type="number" step="0.01" min="0" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div>
                <div><label className="block text-sm font-medium text-gray-700">Precio de Compra</label><input type="number" step="0.01" min="0" value={newProduct.purchasePrice} onChange={e => setNewProduct({ ...newProduct, purchasePrice: parseFloat(e.target.value) || 0 })} className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="Costo de adquisición" /></div>
                <div><label className="block text-sm font-medium text-gray-700">Código de Barras</label><input type="text" value={newProduct.barcode} onChange={e => setNewProduct({...newProduct, barcode: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="EAN, UPC, etc." /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700">Stock {itemToEdit ? 'Actual' : 'Inicial'}</label><input type="number" value={newProduct.initial_stock} onChange={e => setNewProduct({ ...newProduct, initial_stock: parseInt(e.target.value) || 0 })} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div>
                  <div><label className="block text-sm font-medium text-gray-700">Stock Mínimo</label><input type="number" value={newProduct.min_stock} onChange={e => setNewProduct({ ...newProduct, min_stock: parseInt(e.target.value) || 0 })} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div>
                </div>
                 <div><label className="block text-sm font-medium text-gray-700">SKU</label><input type="text" value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Clasificación</h3>
                {renderCategorySelectors()}
              </div>
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              <button onClick={closeModal} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md">Cancelar</button>
              <button onClick={handleSaveProduct} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md">{itemToEdit ? 'Actualizar' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* eliminar */}
      {isDeleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900">Confirmar Eliminación</h2>
            <p className="text-gray-600 mt-4">¿Estás seguro de que deseas eliminar: <span className="font-medium">{itemToDelete.name}</span>?</p>
            <div className="flex justify-end space-x-4 mt-6">
              <button onClick={closeDeleteModal} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md">Cancelar</button>
              <button onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* movimiento */}
      {isMovementModalOpen && itemForMovement && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900">Registrar Movimiento</h2>
            <div className="mt-4"><p className="font-medium">{itemForMovement.name}</p><p className="text-sm text-gray-500">Stock Actual: {itemForMovement.qty}</p></div>
            <div className="space-y-4 mt-6">
              <div><label className="block text-sm font-medium text-gray-700">Tipo</label><select value={movementType} onChange={(e) => setMovementType(e.target.value as 'entrada' | 'salida')} className="mt-1 block w-full border border-gray-300 rounded-md p-2"><option value="entrada">Entrada</option><option value="salida">Salida</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700">Cantidad</label><input type="number" min="1" value={movementQuantity} onChange={(e) => setMovementQuantity(parseInt(e.target.value) || 0)} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button onClick={closeMovementModal} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md">Cancelar</button>
              <button onClick={handleSaveMovement} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md">Registrar</button>
            </div>
          </div>
        </div>
      )}

      {/* importar csv */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-lg">
            <h2 className="text-2xl font-bold text-gray-900">Importar Productos desde CSV</h2>
            <div className="mt-6 space-y-4">
              <p className="text-sm text-gray-600">Sube un archivo CSV. Columnas requeridas:</p>
              <code className="block text-xs bg-gray-100 p-2 rounded">{CSV_TEMPLATE_HEADERS}</code>
              <button onClick={handleDownloadTemplate} className="text-sm text-blue-600 hover:underline flex items-center space-x-1"><IconDownload className="w-4 h-4"/><span>Descargar plantilla</span></button>
              <div><label className="block text-sm font-medium text-gray-700">Archivo</label><input type="file" accept=".csv" onChange={handleFileSelect} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" /></div>
              {importStatus && <p className={`text-sm ${importStatus.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{importStatus}</p>}
            </div>
            <div className="flex justify-end space-x-4 mt-8">
              <button onClick={() => setIsImportModalOpen(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md">Cancelar</button>
              <button onClick={handleProcessImport} disabled={!csvFile} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-md disabled:opacity-50">Procesar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
