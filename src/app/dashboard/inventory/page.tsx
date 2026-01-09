'use client'

import { useState, useEffect } from 'react'
import { useStock, useCreateInventoryItem, useUpdateInventoryItem, useDeleteInventoryItem, InventoryItem } from '../../../lib/hooks/useStock'
import { useCreateMovement } from '../../../lib/hooks/useMovements'
import { useCategories, useBrands, useCreateCategory, useUpdateCategory, useDeleteCategory, useCreateBrand, useUpdateBrand, useDeleteBrand, Category, Brand } from '../../../lib/hooks/useCatalog'
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
  
  // --- estado de tab activo ---
  const [activeTab, setActiveTab] = useState<'inventory' | 'categories' | 'brands'>('inventory');
  
  // --- estados de filtros y paginacion ---
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [modelSearch, setModelSearch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<'normal' | 'low' | 'critical' | ''>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  
  // --- estados para categorías ---
  const [categorySearch, setCategorySearch] = useState<string>('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [selectedParentCategory, setSelectedParentCategory] = useState<string>('');
  const [isSubcategory, setIsSubcategory] = useState<boolean>(false);
  const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState<boolean>(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  
  // --- estados para marcas ---
  const [brandSearch, setBrandSearch] = useState<string>('');
  const [isBrandModalOpen, setIsBrandModalOpen] = useState<boolean>(false);
  const [brandToEdit, setBrandToEdit] = useState<Brand | null>(null);
  const [newBrandName, setNewBrandName] = useState<string>('');
  const [isDeleteBrandModalOpen, setIsDeleteBrandModalOpen] = useState<boolean>(false);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);

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
  
  // Category CRUD hooks
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  
  // Brand CRUD hooks
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();
  
  // Organizar categorías en jerarquía (padres e hijos)
  const organizeCategories = (cats: Category[]): Category[] => {
    const categoryMap = new Map<number, Category>();
    const rootCategories: Category[] = [];
    
    // Primero, crear un mapa de todas las categorías
    cats.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });
    
    // Luego, organizar en jerarquía
    cats.forEach(cat => {
      const category = categoryMap.get(cat.id)!;
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        const parent = categoryMap.get(cat.parentId)!;
        if (!parent.children) parent.children = [];
        parent.children.push(category);
      } else {
        rootCategories.push(category);
      }
    });
    
    return rootCategories;
  };
  
  // Función para aplanar categorías recursivamente para búsqueda
  const flattenCategories = (cats: Category[]): Category[] => {
    const result: Category[] = [];
    cats.forEach(cat => {
      result.push(cat);
      if (cat.children && cat.children.length > 0) {
        result.push(...flattenCategories(cat.children));
      }
    });
    return result;
  };
  
  // Organizar categorías en jerarquía
  const organizedCategories = organizeCategories(categories);
  
  // Filter categories and brands by search
  const allCategoriesFlat = flattenCategories(organizedCategories);
  const filteredCategories = allCategoriesFlat.filter((cat) => {
    return cat.name.toLowerCase().includes(categorySearch.toLowerCase());
  });
  const filteredBrands = brands.filter((brand) => {
    return brand.name.toLowerCase().includes(brandSearch.toLowerCase());
  });
  
  // Obtener todas las categorías planas para el filtro (sin subcategorías anidadas en el select)
  const flatCategories = categories.filter(cat => !cat.parentId);

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
  const inventoryItems = Array.isArray((stockData as any)?.data) ? (stockData as any).data : [];
  const pagination = (stockData as any)?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 };
  
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
        <label className="block text-sm font-medium text-foreground">Categoría</label>
        <select 
          onChange={(e) => setSelectedCategory(e.target.value)} 
          value={selectedCategory} 
          className="mt-1 block w-full border border-border rounded-md p-2"
        >
          <option value="">Selecciona una categoría</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
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
  
  //-------------------
  // GESTIÓN DE CATEGORÍAS
  //-------------------
  const openAddCategoryModal = () => {
    setCategoryToEdit(null);
    setNewCategoryName('');
    setSelectedParentCategory('');
    setIsSubcategory(false);
    setIsCategoryModalOpen(true);
  };
  
  const openEditCategoryModal = (category: Category) => {
    setCategoryToEdit(category);
    setNewCategoryName(category.name);
    setSelectedParentCategory(category.parentId?.toString() || '');
    setIsSubcategory(!!category.parentId);
    setIsCategoryModalOpen(true);
  };
  
  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setCategoryToEdit(null);
    setNewCategoryName('');
    setSelectedParentCategory('');
    setIsSubcategory(false);
  };
  
  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Por favor, ingresa un nombre para la categoría.');
      return;
    }
    
    if (isSubcategory && !selectedParentCategory) {
      alert('Por favor, selecciona una categoría principal para la subcategoría.');
      return;
    }
    
    try {
      if (categoryToEdit) {
        await updateCategory.mutateAsync({
          id: categoryToEdit.id,
          data: { 
            name: newCategoryName.trim(),
            parentId: isSubcategory && selectedParentCategory ? parseInt(selectedParentCategory) : null
          }
        });
      } else {
        await createCategory.mutateAsync({ 
          name: newCategoryName.trim(),
          parentId: isSubcategory && selectedParentCategory ? parseInt(selectedParentCategory) : null
        });
      }
      closeCategoryModal();
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.message || error.message || 'Error al guardar categoría'}`);
    }
  };
  
  const openDeleteCategoryModal = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteCategoryModalOpen(true);
  };
  
  const closeDeleteCategoryModal = () => {
    setIsDeleteCategoryModalOpen(false);
    setCategoryToDelete(null);
  };
  
  const handleConfirmDeleteCategory = async () => {
    if (categoryToDelete) {
      try {
        await deleteCategory.mutateAsync(categoryToDelete.id);
        closeDeleteCategoryModal();
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Error al eliminar';
        if (errorMessage.includes('items') || errorMessage.includes('productos') || errorMessage.includes('asignados')) {
          alert('No se puede eliminar la categoría porque tiene productos asignados.');
        } else {
          alert(`Error: ${errorMessage}`);
        }
      }
    }
  };
  
  //-------------------
  // GESTIÓN DE MARCAS
  //-------------------
  const openAddBrandModal = () => {
    setBrandToEdit(null);
    setNewBrandName('');
    setIsBrandModalOpen(true);
  };
  
  const openEditBrandModal = (brand: Brand) => {
    setBrandToEdit(brand);
    setNewBrandName(brand.name);
    setIsBrandModalOpen(true);
  };
  
  const closeBrandModal = () => {
    setIsBrandModalOpen(false);
    setBrandToEdit(null);
    setNewBrandName('');
  };
  
  const handleSaveBrand = async () => {
    if (!newBrandName.trim()) {
      alert('Por favor, ingresa un nombre para la marca.');
      return;
    }
    
    try {
      if (brandToEdit) {
        await updateBrand.mutateAsync({
          id: brandToEdit.id,
          data: { name: newBrandName.trim() }
        });
      } else {
        await createBrand.mutateAsync({ name: newBrandName.trim() });
      }
      closeBrandModal();
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.message || error.message || 'Error al guardar marca'}`);
    }
  };
  
  const openDeleteBrandModal = (brand: Brand) => {
    setBrandToDelete(brand);
    setIsDeleteBrandModalOpen(true);
  };
  
  const closeDeleteBrandModal = () => {
    setIsDeleteBrandModalOpen(false);
    setBrandToDelete(null);
  };
  
  const handleConfirmDeleteBrand = async () => {
    if (brandToDelete) {
      try {
        await deleteBrand.mutateAsync(brandToDelete.id);
        closeDeleteBrandModal();
      } catch (error: any) {
        alert(`Error: ${error.response?.data?.message || error.message || 'Error al eliminar marca'}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* --- encabezado con menu --- */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventario</h1>
          <p className="text-muted-foreground">Gestión de stock por sucursal</p>
        </div>
        
        {/* boton de acciones con menu - solo mostrar en tab de inventario */}
        {activeTab === 'inventory' && (
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
                <div className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-lg z-20 border border-gray-200 overflow-hidden">
                  <button
                    onClick={openAddModal}
                    className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <IconPlus className="w-4 h-4 text-muted-foreground" />
                    <span>Agregar Manualmente</span>
                  </button>
                  <button
                    onClick={openImportModal}
                    className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-gray-100 flex items-center space-x-2 border-t border-gray-100"
                  >
                    <IconUpload className="w-4 h-4 text-muted-foreground" />
                    <span>Importar CSV</span>
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <IconDownload className="w-4 h-4 text-muted-foreground" />
                    <span>Exportar CSV</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* --- Tabs --- */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'inventory'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            Inventario
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            Categorías
          </button>
          <button
            onClick={() => setActiveTab('brands')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'brands'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            Marcas
          </button>
        </nav>
      </div>

      {/* --- Contenido según tab activo --- */}
      {activeTab === 'inventory' && (
        <>
          {/* --- Filtros en la parte superior --- */}
          <div className="bg-card p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-foreground mb-4">Filtros</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-foreground">Categoría</label>
                <select 
                  onChange={(e) => setFilterCategory(e.target.value)} 
                  value={filterCategory} 
                  className="w-full border border-border rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Todas las categorías</option>
                  {flatCategories.map((cat) => (
                    <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-foreground">Marca</label>
                <select 
                  value={selectedBrand} 
                  onChange={(e) => setSelectedBrand(e.target.value)} 
                  className="w-full border border-border rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Todas las marcas</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.name}>{brand.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-foreground">Modelo</label>
                <input 
                  value={modelSearch} 
                  onChange={(e) => setModelSearch(e.target.value)} 
                  type="text" 
                  placeholder="Buscar modelo..." 
                  className="w-full border border-border rounded-md px-3 py-2 text-sm" 
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-foreground">Estado</label>
                <select 
                  value={selectedStatus} 
                  onChange={(e) => setSelectedStatus(e.target.value as 'normal' | 'low' | 'critical' | '')} 
                  className="w-full border border-border rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Todos los estados</option>
                  <option value="normal">Normal</option>
                  <option value="low">Bajo</option>
                  <option value="critical">Crítico</option>
                </select>
              </div>
            </div>
          </div>

          {/* --- tabla --- */}
          <div className="w-full">
            <div className="bg-card rounded-lg shadow overflow-hidden">
            {isLoading && (
              <div className="p-8 text-center text-muted-foreground">Cargando inventario...</div>
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
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Reservado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Mín/Máx</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Precio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {paginatedInventory.map((item:InventoryItem) => (
                    <tr key={item.id} className="hover:bg-muted">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-foreground">{item.name}</div>
                          <div className="text-sm text-muted-foreground">{item.brand} - {item.model}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{item.sku}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">{item.qty}</div>
                        <div className="text-sm text-muted-foreground">Disp: {item.qty - item.reserved}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{item.reserved}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{item.min} / {item.max}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">${((item.price || 0)).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.status === 'critical' ? 'bg-red-100 text-red-800' : item.status === 'low' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                          {item.status === 'critical' ? 'Crítico' : item.status === 'low' ? 'Bajo' : 'Normal'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          {can('canEditPrices') && (
                            <button onClick={() => openEditModal(item)} title="Editar" className="p-1 rounded-md text-primary hover:bg-blue-100 hover:text-blue-800 transition-colors"><IconEdit className="w-5 h-5" /></button>
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
            <div className="bg-card px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1 || isLoading} className="relative inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted disabled:opacity-50">Anterior</button>
                <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages || isLoading} className="ml-3 relative inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted disabled:opacity-50">Siguiente</button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-foreground">
                    Mostrando <span className="font-medium">{totalItems > 0 ? startIndex + 1 : 0}</span> a <span className="font-medium">{Math.min(endIndex, totalItems)}</span> de <span className="font-medium">{totalItems}</span> resultados
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <label htmlFor="itemsPerPage" className="text-sm text-foreground">Items por pág:</label>
                  <select id="itemsPerPage" value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="border border-border rounded-md px-2 py-1 text-sm">
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1 || isLoading} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50">Anterior</button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-border bg-card text-sm font-medium text-foreground">
                      Pág {pagination.page} de {totalPages || 1}
                    </span>
                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages || totalPages === 0 || isLoading} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50">Siguiente</button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
          </div>
        </>
      )}

      {/* --- Tab de Categorías --- */}
      {activeTab === 'categories' && (
        <div className="bg-card rounded-lg shadow">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h2 className="text-xl font-bold text-foreground">Categorías</h2>
            <button
              onClick={openAddCategoryModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
            >
              <IconPlus className="w-4 h-4" />
              <span>Agregar Categoría</span>
            </button>
          </div>
          <div className="p-4">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar categoría..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full border border-border rounded-md px-4 py-2"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-muted-foreground">
                        No hay categorías disponibles
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((category) => {
                      const isSubcat = !!category.parentId;
                      const parentCategory = categories.find(c => c.id === category.parentId);
                      return (
                        <tr key={category.id} className="hover:bg-muted">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{category.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                            {isSubcat && <span className="text-muted-foreground mr-2">└─</span>}
                            {category.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {isSubcat ? (
                              <span className="text-xs">Subcategoría de: {parentCategory?.name || 'N/A'}</span>
                            ) : (
                              <span className="text-xs">Categoría principal</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-3">
                              {!isSubcat && (
                                <button
                                  onClick={() => {
                                    setSelectedParentCategory(category.id.toString());
                                    setIsSubcategory(true);
                                    setNewCategoryName('');
                                    setCategoryToEdit(null);
                                    setIsCategoryModalOpen(true);
                                  }}
                                  title="Agregar subcategoría"
                                  className="p-1 rounded-md text-green-600 hover:bg-green-100 hover:text-green-800 transition-colors"
                                >
                                  <IconPlus className="w-5 h-5" />
                                </button>
                              )}
                              <button
                                onClick={() => openEditCategoryModal(category)}
                                title="Editar"
                                className="p-1 rounded-md text-primary hover:bg-blue-100 hover:text-blue-800 transition-colors"
                              >
                                <IconEdit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => openDeleteCategoryModal(category)}
                                title="Eliminar"
                                className="p-1 rounded-md text-red-600 hover:bg-red-100 hover:text-red-800 transition-colors"
                              >
                                <IconDelete className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- Tab de Marcas --- */}
      {activeTab === 'brands' && (
        <div className="bg-card rounded-lg shadow">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h2 className="text-xl font-bold text-foreground">Marcas</h2>
            <button
              onClick={openAddBrandModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
            >
              <IconPlus className="w-4 h-4" />
              <span>Agregar Marca</span>
            </button>
          </div>
          <div className="p-4">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar marca..."
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                className="w-full border border-border rounded-md px-4 py-2"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {filteredBrands.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-muted-foreground">
                        No hay marcas disponibles
                      </td>
                    </tr>
                  ) : (
                    filteredBrands.map((brand) => (
                      <tr key={brand.id} className="hover:bg-muted">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{brand.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{brand.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => openEditBrandModal(brand)}
                              title="Editar"
                              className="p-1 rounded-md text-primary hover:bg-blue-100 hover:text-blue-800 transition-colors"
                            >
                              <IconEdit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => openDeleteBrandModal(brand)}
                              title="Eliminar"
                              className="p-1 rounded-md text-red-600 hover:bg-red-100 hover:text-red-800 transition-colors"
                            >
                              <IconDelete className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* --- Modales --- */}
      
      {/* agregar/editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-card p-8 rounded-lg shadow-2xl w-full max-w-4xl max-h-full overflow-y-auto space-y-6">
            <h2 className="text-2xl font-bold text-foreground">{itemToEdit ? 'Editar Producto' : 'Agregar Nuevo Producto'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-foreground">Nombre</label><input type="text" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="mt-1 block w-full border border-border rounded-md p-2" /></div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Marca</label>
                  <select value={newProduct.brand} onChange={e => setNewProduct({ ...newProduct, brand: e.target.value })} className="mt-1 block w-full border border-border rounded-md p-2">
                    <option value="">Selecciona una marca</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.name}>{brand.name}</option>
                    ))}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-foreground">Precio de Venta</label><input type="number" step="0.01" min="0" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })} className="mt-1 block w-full border border-border rounded-md p-2" /></div>
                <div><label className="block text-sm font-medium text-foreground">Precio de Compra</label><input type="number" step="0.01" min="0" value={newProduct.purchasePrice} onChange={e => setNewProduct({ ...newProduct, purchasePrice: parseFloat(e.target.value) || 0 })} className="mt-1 block w-full border border-border rounded-md p-2" placeholder="Costo de adquisición" /></div>
                <div><label className="block text-sm font-medium text-foreground">Código de Barras</label><input type="text" value={newProduct.barcode} onChange={e => setNewProduct({...newProduct, barcode: e.target.value})} className="mt-1 block w-full border border-border rounded-md p-2" placeholder="EAN, UPC, etc." /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-foreground">Stock {itemToEdit ? 'Actual' : 'Inicial'}</label><input type="number" value={newProduct.initial_stock} onChange={e => setNewProduct({ ...newProduct, initial_stock: parseInt(e.target.value) || 0 })} className="mt-1 block w-full border border-border rounded-md p-2" /></div>
                  <div><label className="block text-sm font-medium text-foreground">Stock Mínimo</label><input type="number" value={newProduct.min_stock} onChange={e => setNewProduct({ ...newProduct, min_stock: parseInt(e.target.value) || 0 })} className="mt-1 block w-full border border-border rounded-md p-2" /></div>
                </div>
                 <div><label className="block text-sm font-medium text-foreground">SKU</label><input type="text" value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} className="mt-1 block w-full border border-border rounded-md p-2" /></div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground border-b pb-2">Clasificación</h3>
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
          <div className="bg-card p-6 rounded-lg shadow-2xl w-full max-w-md">
            <h2 className="text-xl font-bold text-foreground">Confirmar Eliminación</h2>
            <p className="text-muted-foreground mt-4">¿Estás seguro de que deseas eliminar: <span className="font-medium">{itemToDelete.name}</span>?</p>
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
          <div className="bg-card p-6 rounded-lg shadow-2xl w-full max-w-md">
            <h2 className="text-xl font-bold text-foreground">Registrar Movimiento</h2>
            <div className="mt-4"><p className="font-medium">{itemForMovement.name}</p><p className="text-sm text-muted-foreground">Stock Actual: {itemForMovement.qty}</p></div>
            <div className="space-y-4 mt-6">
              <div><label className="block text-sm font-medium text-foreground">Tipo</label><select value={movementType} onChange={(e) => setMovementType(e.target.value as 'entrada' | 'salida')} className="mt-1 block w-full border border-border rounded-md p-2"><option value="entrada">Entrada</option><option value="salida">Salida</option></select></div>
              <div><label className="block text-sm font-medium text-foreground">Cantidad</label><input type="number" min="1" value={movementQuantity} onChange={(e) => setMovementQuantity(parseInt(e.target.value) || 0)} className="mt-1 block w-full border border-border rounded-md p-2" /></div>
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
          <div className="bg-card p-6 rounded-lg shadow-2xl w-full max-w-lg">
            <h2 className="text-2xl font-bold text-foreground">Importar Productos desde CSV</h2>
            <div className="mt-6 space-y-4">
              <p className="text-sm text-muted-foreground">Sube un archivo CSV. Columnas requeridas:</p>
              <code className="block text-xs bg-gray-100 p-2 rounded">{CSV_TEMPLATE_HEADERS}</code>
              <button onClick={handleDownloadTemplate} className="text-sm text-primary hover:underline flex items-center space-x-1"><IconDownload className="w-4 h-4"/><span>Descargar plantilla</span></button>
              <div><label className="block text-sm font-medium text-foreground">Archivo</label><input type="file" accept=".csv" onChange={handleFileSelect} className="mt-1 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-blue-700 hover:file:bg-blue-100" /></div>
              {importStatus && <p className={`text-sm ${importStatus.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{importStatus}</p>}
            </div>
            <div className="flex justify-end space-x-4 mt-8">
              <button onClick={() => setIsImportModalOpen(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md">Cancelar</button>
              <button onClick={handleProcessImport} disabled={!csvFile} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-md disabled:opacity-50">Procesar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Categoría */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-card p-6 rounded-lg shadow-2xl w-full max-w-md">
            <h2 className="text-xl font-bold text-foreground">
              {categoryToEdit 
                ? 'Editar Categoría' 
                : isSubcategory 
                  ? 'Agregar Subcategoría' 
                  : 'Agregar Categoría'}
            </h2>
            <div className="mt-4 space-y-4">
              {categoryToEdit && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">ID</label>
                  <input
                    type="text"
                    value={categoryToEdit.id}
                    disabled
                    className="w-full border border-border rounded-md px-3 py-2 bg-gray-100 text-muted-foreground"
                  />
                </div>
              )}
              {!categoryToEdit && (
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isSubcategory}
                      onChange={(e) => {
                        setIsSubcategory(e.target.checked);
                        if (!e.target.checked) {
                          setSelectedParentCategory('');
                        }
                      }}
                      className="rounded border-border"
                    />
                    <span className="text-sm font-medium text-foreground">Crear como subcategoría</span>
                  </label>
                </div>
              )}
              {isSubcategory && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Categoría Principal</label>
                  <select
                    value={selectedParentCategory}
                    onChange={(e) => setSelectedParentCategory(e.target.value)}
                    className="w-full border border-border rounded-md px-3 py-2"
                    disabled={!!categoryToEdit}
                  >
                    <option value="">Selecciona una categoría principal</option>
                    {flatCategories
                      .filter(cat => !categoryToEdit || cat.id !== categoryToEdit.id)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
                      ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nombre</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder={isSubcategory ? "Nombre de la subcategoría" : "Nombre de la categoría"}
                  className="w-full border border-border rounded-md px-3 py-2"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={closeCategoryModal}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCategory}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
              >
                {categoryToEdit ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Eliminar Categoría */}
      {isDeleteCategoryModalOpen && categoryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-card p-6 rounded-lg shadow-2xl w-full max-w-md">
            <h2 className="text-xl font-bold text-foreground">Confirmar Eliminación</h2>
            <p className="text-muted-foreground mt-4">
              ¿Estás seguro de que deseas eliminar la categoría: <span className="font-medium">{categoryToDelete.name}</span>?
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Solo se puede eliminar si no tiene productos asignados.
            </p>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={closeDeleteCategoryModal}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteCategory}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Marca */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-card p-6 rounded-lg shadow-2xl w-full max-w-md">
            <h2 className="text-xl font-bold text-foreground">
              {brandToEdit ? 'Editar Marca' : 'Agregar Marca'}
            </h2>
            <div className="mt-4 space-y-4">
              {brandToEdit && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">ID</label>
                  <input
                    type="text"
                    value={brandToEdit.id}
                    disabled
                    className="w-full border border-border rounded-md px-3 py-2 bg-gray-100 text-muted-foreground"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nombre</label>
                <input
                  type="text"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="Nombre de la marca"
                  className="w-full border border-border rounded-md px-3 py-2"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={closeBrandModal}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveBrand}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
              >
                {brandToEdit ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Eliminar Marca */}
      {isDeleteBrandModalOpen && brandToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-card p-6 rounded-lg shadow-2xl w-full max-w-md">
            <h2 className="text-xl font-bold text-foreground">Confirmar Eliminación</h2>
            <p className="text-muted-foreground mt-4">
              ¿Estás seguro de que deseas eliminar la marca: <span className="font-medium">{brandToDelete.name}</span>?
            </p>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={closeDeleteBrandModal}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteBrand}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

