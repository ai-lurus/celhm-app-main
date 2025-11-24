'use client'

import { useState, useEffect } from 'react'

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
interface InventoryItem {
  id: number;
  sku: string;
  name: string;
  brand: string;
  model: string;
  qty: number;
  min: number;
  max: number;
  reserved: number;
  price: number;
  status: 'normal' | 'low' | 'critical';
  categoryId: number;
}
interface NewProductForm {
  name: string;
  brand: string;
  price: number;
  cost: number;
  sku: string;
  initial_stock: number;
  min_stock: number;
}

// --- datos de filtros (Mock) ---
const filtersData: {
  categorias: { type: string, label: string, data: Category[] },
  marcas: { type: string, label: string, options: Brand[] }
} = {
  "categorias": {
    "type": "tree",
    "label": "Categorías",
    "data": [
      {
        "id": 1, "name": "ACCESORIOS", "children": [
          {
            "id": 10, "name": "Micas", "children": [
              {
                "id": 20, "name": "Glass (cristal)", "children": [
                  {
                    "id": 30, "name": "iPhone", "children": [
                      { "id": 301, "name": "11" },
                      { "id": 302, "name": "12 Pro Max" },
                      { "id": 303, "name": "15 Plus" }
                    ]
                  },
                  { "id": 31, "name": "Samsung" },
                  { "id": 32, "name": "Xiaomi" }
                ]
              },
              {
                "id": 21, "name": "Hydrogel", "children": [
                  { "id": 311, "name": "iPhone" },
                  { "id": 312, "name": "Samsung" }
                ]
              }
            ]
          },
          { "id": 11, "name": "Protectores (marcas)" },
          { "id": 12, "name": "Cables y Cargadores" }
        ]
      },
      {
        "id": 2, "name": "EQUIPOS", "children": [
          { "id": 40, "name": "Celulares" },
          { "id": 41, "name": "Tablets" },
          { "id": 42, "name": "Smart Watch" }
        ]
      },
    ]
  },
  "marcas": {
    "type": "select", "label": "Marca", "options": [
      { "label": "Apple", "value": "Apple" },
      { "label": "Samsung", "value": "Samsung" },
      { "label": "Genérica", "value": "Genérica" }
    ]
  },
};

const newProductInitialState: NewProductForm = {
  name: '',
  brand: '',
  price: 0,
  cost: 0,
  sku: '',
  initial_stock: 10,
  min_stock: 5,
};

// --- datos de formularios iniciales ---
const initialInventory: InventoryItem[] = [
  { id: 1, sku: 'LCD-IP12-BLK', name: 'Pantalla LCD iPhone 12 Negro', brand: 'Apple', model: 'iPhone 12', qty: 25, min: 5, max: 100, reserved: 2, price: 2500, status: 'normal', categoryId: 302 },
  { id: 3, sku: 'BAT-SGS21-4000', name: 'Batería Samsung Galaxy S21', brand: 'Samsung', model: 'Galaxy S21', qty: 3, min: 5, max: 100, reserved: 1, price: 800, status: 'low', categoryId: 40 },
  { id: 4, sku: 'MIC-HYD-IP11', name: 'Mica Hydrogel iPhone 11', brand: 'Genérica', model: 'iPhone 11', qty: 50, min: 10, max: 200, reserved: 5, price: 150, status: 'normal', categoryId: 311 },
  { id: 5, sku: 'ACC-CAB-LIG', name: 'Cable Lightning', brand: 'Genérica', model: 'Varios', qty: 15, min: 5, max: 50, reserved: 0, price: 200, status: 'normal', categoryId: 12 },
];

const CSV_TEMPLATE_HEADERS = "sku,name,brand,model,qty,min,max,price,status,categoryId";

export default function InventoryPage() {
  const [user, setUser] = useState<any>(null);
  
  // --- estados de filtros y paginacion ---
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [modelSearch, setModelSearch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [filterCategoryPath, setFilterCategoryPath] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);

  // --- estados de modales ---
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedCategoryPath, setSelectedCategoryPath] = useState<number[]>([]);
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

  // estado principal de datos
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(initialInventory);

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) setUser(JSON.parse(storedUser));
  }, [])
  
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBrand, modelSearch, selectedStatus, filterCategoryPath, itemsPerPage]);

  //---------------------
  // LOGICA DE FUNCIONES
  //----------------------

  const findPathToCategory = (id: number, categories: Category[] = filtersData.categorias.data, path: number[] = []): number[] | null => {
    for (const category of categories) {
      const currentPath = [...path, category.id];
      if (category.id === id) return currentPath;
      if (category.children) {
        const foundPath = findPathToCategory(id, category.children, currentPath);
        if (foundPath) return foundPath;
      }
    }
    return null;
  };

  // --- Gestion de productos (agregar/editar) ---
  const openAddModal = () => {
    setItemToEdit(null);
    setNewProduct(newProductInitialState);
    setSelectedCategoryPath([]);
    setIsModalOpen(true);
    setShowActionsDropdown(false);
  };

  const openEditModal = (item: InventoryItem) => {
    setItemToEdit(item);
    setNewProduct({
      name: item.name,
      brand: item.brand,
      price: item.price,
      cost: 0, 
      sku: item.sku,
      initial_stock: item.qty,
      min_stock: item.min,
    });
    const path = findPathToCategory(item.categoryId);
    setSelectedCategoryPath(path || []);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setItemToEdit(null);
    setNewProduct(newProductInitialState);
    setSelectedCategoryPath([]);
  };

  const handleCategoryChange = (level: number, categoryId: string) => {
    const newPath = selectedCategoryPath.slice(0, level);
    if (categoryId) newPath.push(parseInt(categoryId));
    setSelectedCategoryPath(newPath);
  };

  const renderCategorySelectors = () => {
    const selectors = [];
    let currentLevelOptions: Category[] | undefined = filtersData.categorias.data;

    if (currentLevelOptions) {
      selectors.push(
        <div key={0}>
          <label className="block text-sm font-medium text-gray-700">Categoría Nivel 1</label>
          <select onChange={(e) => handleCategoryChange(0, e.target.value)} value={selectedCategoryPath[0] || ''} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
            <option value="">Selecciona...</option>
            {currentLevelOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
          </select>
        </div>
      );
    }
    for (let i = 0; i < selectedCategoryPath.length; i++) {
      if (!currentLevelOptions) break;
      const selectedId = selectedCategoryPath[i];
      const selectedNode = currentLevelOptions.find(opt => opt.id === selectedId);
      if (selectedNode?.children && selectedNode.children.length > 0) {
        currentLevelOptions = selectedNode.children; 
        selectors.push(
          <div key={i + 1}>
            <label className="block text-sm font-medium text-gray-700">{`Categoría Nivel ${i + 2}`}</label>
            <select onChange={(e) => handleCategoryChange(i + 1, e.target.value)} value={selectedCategoryPath[i + 1] || ''} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
              <option value="">Selecciona...</option>
              {currentLevelOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
            </select>
          </div>
        );
      } else {
        currentLevelOptions = undefined; 
      }
    }
    return selectors;
  };

  const handleSaveProduct = () => {
    const finalCategoryId = selectedCategoryPath[selectedCategoryPath.length - 1];
    if (!newProduct.name || !finalCategoryId) {
      alert('Por favor, completa el nombre y selecciona una categoría final.');
      return;
    }
    
    // validar categoria hoja
    let selectedNode: Category | undefined;
    let categoryList: Category[] | undefined = filtersData.categorias.data;
    for (const id of selectedCategoryPath) {
      if (!categoryList) break;
      selectedNode = categoryList.find(node => node.id === id);
      categoryList = selectedNode?.children;
    }
    if (selectedNode?.children && selectedNode.children.length > 0) {
        alert('Debes seleccionar la categoría más específica.');
        return;
    }
    
    if (itemToEdit) {
      setInventoryItems(prevItems => prevItems.map(item => {
        if (item.id === itemToEdit.id) {
          return {
            ...item,
            name: newProduct.name,
            brand: newProduct.brand,
            price: newProduct.price,
            sku: newProduct.sku,
            qty: newProduct.initial_stock,
            min: newProduct.min_stock,
            categoryId: finalCategoryId,
            status: newProduct.initial_stock <= newProduct.min_stock ? (newProduct.initial_stock <= 0 ? 'critical' : 'low') : 'normal',
          };
        }
        return item;
      }));
    } else {
      const newItem: InventoryItem = {
        id: Math.max(0, ...inventoryItems.map(i => i.id)) + 1,
        sku: newProduct.sku || `SKU-${Date.now()}`,
        name: newProduct.name,
        brand: newProduct.brand,
        model: 'Nuevo Modelo',
        qty: newProduct.initial_stock,
        min: newProduct.min_stock,
        max: 100, 
        reserved: 0,
        price: newProduct.price,
        status: newProduct.initial_stock <= newProduct.min_stock ? (newProduct.initial_stock <= 0 ? 'critical' : 'low') : 'normal',
        categoryId: finalCategoryId,
      };
      setInventoryItems([...inventoryItems, newItem]);
    }
    closeModal();
  };

  // --- filtros en la sidebar ---
  const handlePageFilterCategoryChange = (level: number, categoryId: string) => {
    const newPath = filterCategoryPath.slice(0, level);
    if (categoryId) newPath.push(parseInt(categoryId));
    setFilterCategoryPath(newPath);
  };

  const renderPageFilterSelectors = () => {
    const selectors = [];
    let currentLevelOptions: Category[] | undefined = filtersData.categorias.data;

    if (currentLevelOptions) {
      selectors.push(
        <div key="filter-0">
          <label className="block text-sm font-medium text-gray-700">Categoría Nivel 1</label>
          <select onChange={(e) => handlePageFilterCategoryChange(0, e.target.value)} value={filterCategoryPath[0] || ''} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
            <option value="">Todas las categorías</option>
            {currentLevelOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
          </select>
        </div>
      );
    }
    for (let i = 0; i < filterCategoryPath.length; i++) {
      if (!currentLevelOptions) break; 
      const selectedId = filterCategoryPath[i];
      const selectedNode = currentLevelOptions.find(opt => opt.id === selectedId);
      if (selectedNode?.children && selectedNode.children.length > 0) {
        currentLevelOptions = selectedNode.children;
        selectors.push(
          <div key={`filter-${i + 1}`}>
            <label className="block text-sm font-medium text-gray-700">{`Categoría Nivel ${i + 2}`}</label>
            <select onChange={(e) => handlePageFilterCategoryChange(i + 1, e.target.value)} value={filterCategoryPath[i + 1] || ''} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
              <option value="">Todas en {selectedNode.name}</option>
              {currentLevelOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
            </select>
          </div>
        );
      } else {
        currentLevelOptions = undefined;
      }
    }
    return selectors;
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
  const handleConfirmDelete = () => {
    if (itemToDelete) {
      setInventoryItems(prevItems => prevItems.filter(item => item.id !== itemToDelete.id));
      closeDeleteModal();
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
  const handleSaveMovement = () => {
    if (movementQuantity <= 0) {
      alert('La cantidad debe ser mayor a 0.');
      return;
    }
    setInventoryItems(prevItems => prevItems.map(item => {
      if (itemForMovement && item.id === itemForMovement.id) {
        const newQty = movementType === 'entrada' 
          ? item.qty + movementQuantity 
          : item.qty - movementQuantity;
        if (newQty < 0) {
          alert('Error: No se puede registrar una salida que deje el stock en negativo.');
          return item;
        }
        return {
          ...item,
          qty: newQty,
          status: newQty <= item.min ? (newQty <= 0 ? 'critical' : 'low') : 'normal'
        };
      }
      return item;
    }));
    closeMovementModal();
  };

  // --- exportar csv ---
  const handleExportCSV = () => {
    const headers = ["id", "sku", "name", "brand", "model", "qty", "min", "max", "reserved", "price", "status", "categoryId"];
    const data = filteredInventory.map(item => [
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
    reader.onload = (e) => {
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
        let maxId = Math.max(0, ...inventoryItems.map(i => i.id));

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
        setInventoryItems(prevItems => [...prevItems, ...newItems]);
        setImportStatus(`¡Éxito! Se importaron ${newItems.length} productos.`);
        setCsvFile(null);
        setIsImportModalOpen(false);
      } catch (error: any) {
        setImportStatus(`Error: ${error.message}`);
      }
    };
    reader.readAsText(csvFile);
  };
  
  // --- filtrado y paginacion ---
  const getAllChildrenIds = (categoryId: number): number[] => {
    let ids: number[] = [categoryId];
    let queue: Category[] = [...filtersData.categorias.data];
    let node: Category | undefined = undefined;
    while (queue.length > 0) {
        const current = queue.shift();
        if (!current) continue;
        if (current.id === categoryId) { node = current; break; }
        if (current.children) queue.push(...current.children);
    }
    if (!node) return [categoryId];
    let childrenQueue = node.children ? [...node.children] : [];
    while (childrenQueue.length > 0) {
        const child = childrenQueue.shift();
        if (!child) continue;
        ids.push(child.id);
        if (child.children) childrenQueue.push(...child.children);
    }
    return ids;
  };

  const filteredInventory = inventoryItems.filter(item => {
    let categoryMatch = true;
    if (filterCategoryPath.length > 0) {
      const lastSelectedCategoryId = filterCategoryPath[filterCategoryPath.length - 1];
      const allowedCategoryIds = getAllChildrenIds(lastSelectedCategoryId);
      categoryMatch = allowedCategoryIds.includes(item.categoryId);
    }
    const brandMatch = selectedBrand === '' || item.brand === selectedBrand;
    const modelMatch = modelSearch === '' || item.model.toLowerCase().includes(modelSearch.toLowerCase());
    const statusMatch = selectedStatus === '' || item.status === selectedStatus;
    return categoryMatch && brandMatch && modelMatch && statusMatch;
  });

  const totalItems = filteredInventory.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInventory = filteredInventory.slice(startIndex, endIndex);

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
                {filtersData.marcas.options.map(brand => <option key={brand.value} value={brand.value}>{brand.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
              <input value={modelSearch} onChange={(e) => setModelSearch(e.target.value)} type="text" placeholder="Buscar modelo..." className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2">
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
                  {paginatedInventory.map((item) => (
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
                          <button onClick={() => openEditModal(item)} title="Editar" className="p-1 rounded-md text-blue-600 hover:bg-blue-100 hover:text-blue-800 transition-colors"><IconEdit className="w-5 h-5" /></button>
                          <button onClick={() => openMovementModal(item)} title="Movimiento" className="p-1 rounded-md text-green-600 hover:bg-green-100 hover:text-green-800 transition-colors"><IconMovement className="w-5 h-5" /></button>
                          <button onClick={() => openDeleteModal(item)} title="Eliminar" className="p-1 rounded-md text-red-600 hover:bg-red-100 hover:text-red-800 transition-colors"><IconDelete className="w-5 h-5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* --- paginacion --- */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Anterior</button>
                <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Siguiente</button>
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
                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">Anterior</button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      Pág {currentPage} de {totalPages || 1}
                    </span>
                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages || totalPages === 0} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">Siguiente</button>
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
                    <option value="">Selecciona una marca</option>{filtersData.marcas.options.map(brand => <option key={brand.value} value={brand.value}>{brand.label}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700">Precio</label><input type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })} className="mt-1 block w-full border border-gray-300 rounded-md p-2" /></div>
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
