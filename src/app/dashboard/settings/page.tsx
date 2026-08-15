"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import {
  useOrganization,
  useUpdateOrganization,
  TicketLegend,
  SkuMaskSegment,
} from "../../../lib/hooks/useOrganization";
import { renderSkuMask } from "../../../lib/sku-mask";
import { useToast } from "../../../hooks/use-toast";

export default function CompanySettingsPage() {
  const { data: organization, isLoading } = useOrganization();
  const updateOrganization = useUpdateOrganization();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    taxId: "",
    website: "",
    currency: "",
    vatRate: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const companySchema = z.object({
    name: z.string().min(1, "El nombre de la empresa es obligatorio"),
    phone: z.string().optional(),
    address: z.string().optional(),
    email: z
      .string()
      .email("Debe ser un correo electrónico válido")
      .or(z.literal(""))
      .optional(),
    taxId: z.string().optional(),
    website: z
      .string()
      .url("Debe ser una URL válida (ej. https://ejemplo.com)")
      .or(z.literal(""))
      .optional(),
    currency: z.string().optional(),
    vatRate: z
      .number()
      .min(0, "La tasa de IVA no puede ser menor que 0")
      .max(100, "La tasa de IVA no puede ser mayor que 100")
      .optional(),
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [ticketLegends, setTicketLegends] = useState<TicketLegend[]>([]);
  const [savedTicketLegends, setSavedTicketLegends] = useState<TicketLegend[]>([]);
  const [skuMaskConfig, setSkuMaskConfig] = useState<SkuMaskSegment[]>([]);
  const [savedSkuMaskConfig, setSavedSkuMaskConfig] = useState<SkuMaskSegment[]>([]);

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || "",
        address: organization.address || "",
        phone: organization.phone || "",
        email: organization.email || "",
        taxId: organization.taxId || "",
        website: organization.website || "",
        currency: organization.currency || "",
        vatRate: organization.vatRate || 0,
      });
      if (organization.logo) {
        setLogoPreview(organization.logo);
      }
      setTicketLegends(organization.ticketLegends);
      setSavedTicketLegends(organization.ticketLegends);
      setSkuMaskConfig(organization.skuMaskConfig);
      setSavedSkuMaskConfig(organization.skuMaskConfig);
    }
  }, [organization]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for the field when typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño del archivo (max 2MB)
      const MAX_SIZE_MB = 2;
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Imagen demasiado grande",
          description: `El logo no debe superar los ${MAX_SIZE_MB}MB.`,
        });
        e.target.value = '';
        return;
      }

      // Crear vista previa
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      // TODO: Subir a servidor y obtener URL
    }
  };

  const updateTicketLegend = (
    id: string,
    field: "label" | "body" | "enabled",
    value: string | boolean
  ) => {
    setTicketLegends((prev) =>
      prev.map((legend) =>
        legend.id === id ? { ...legend, [field]: value } : legend
      )
    );
  };

  const SKU_MASK_SLOTS = 4;

  const padSkuMaskConfig = (segments: SkuMaskSegment[]): SkuMaskSegment[] => {
    const padded = [...segments];
    while (padded.length < SKU_MASK_SLOTS) {
      padded.push({ type: "literal", value: "" });
    }
    return padded.slice(0, SKU_MASK_SLOTS);
  };

  const updateSkuMaskSlot = (index: number, segment: SkuMaskSegment) => {
    setSkuMaskConfig((prev) => {
      const next = padSkuMaskConfig(prev);
      next[index] = segment;
      return next;
    });
  };

  const handleSkuMaskTypeChange = (index: number, type: SkuMaskSegment["type"]) => {
    if (type === "literal") updateSkuMaskSlot(index, { type: "literal", value: "" });
    else if (type === "sequence") updateSkuMaskSlot(index, { type: "sequence", digits: 4 });
    else updateSkuMaskSlot(index, { type, length: 2 });
  };

  const hasSkuMaskChanges =
    JSON.stringify(padSkuMaskConfig(skuMaskConfig)) !== JSON.stringify(padSkuMaskConfig(savedSkuMaskConfig));

  const handleSkuMaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleaned = padSkuMaskConfig(skuMaskConfig);
      await updateOrganization.mutateAsync({ skuMaskConfig: cleaned });
      setSkuMaskConfig(cleaned);
      setSavedSkuMaskConfig(cleaned);
      toast({
        variant: "success",
        title: "Máscara de código guardada",
        description: "La configuración del generador de SKU se actualizó correctamente.",
      });
    } catch (error) {
      console.error("Error actualizando la máscara de SKU:", error);
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: "Hubo un error al actualizar la máscara de código.",
      });
    }
  };

  const skuMaskPreview = renderSkuMask(padSkuMaskConfig(skuMaskConfig), {
    root: "Accesorios",
    category: "Cables",
    product: "Cable USB-C",
    seq: 1,
  });

  const hasTicketLegendsChanges =
    JSON.stringify(ticketLegends) !== JSON.stringify(savedTicketLegends);

  const handleTicketLegendsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateOrganization.mutateAsync({ ticketLegends });
      setSavedTicketLegends(ticketLegends);
      toast({
        variant: "success",
        title: "Configuración de ticket guardada",
        description: "Las leyendas del pie de ticket se actualizaron correctamente.",
      });
    } catch (error) {
      console.error("Error actualizando las leyendas del ticket:", error);
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: "Hubo un error al actualizar la configuración del ticket.",
      });
    }
  };

  const hasChanges = organization
    ? formData.name !== (organization.name || "") ||
      formData.address !== (organization.address || "") ||
      formData.phone !== (organization.phone || "") ||
      formData.email !== (organization.email || "") ||
      formData.taxId !== (organization.taxId || "") ||
      formData.website !== (organization.website || "") ||
      formData.currency !== (organization.currency || "") ||
      formData.vatRate !== (organization.vatRate || 0) ||
      logoPreview !== (organization.logo || null)
    : false;

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const validatedData = companySchema.parse({
        ...formData,
        vatRate: Number(formData.vatRate),
      });

      await updateOrganization.mutateAsync({
        ...validatedData,
        logo: logoPreview || undefined,
      });
      toast({
        variant: "success",
        title: "Configuración guardada",
        description: "Los cambios se han guardado correctamente.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
        toast({
          variant: "destructive",
          title: "Error de validación",
          description: "Por favor revisa los campos del formulario.",
        });
        return;
      }

      console.error("Error actualizando la organización:", error);
      
      let errorMessage = "Hubo un error al actualizar la configuración de la empresa.";
      if (error && typeof error === "object" && "response" in error) {
        const responseData = (error as any).response?.data;
        const status = (error as any).response?.status;
        if (status === 413) {
          errorMessage = "La imagen es demasiado grande. Por favor, sube una imagen de menor tamaño.";
        } else if (responseData && responseData.message) {
          errorMessage = Array.isArray(responseData.message) 
            ? responseData.message[0] 
            : responseData.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: errorMessage,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Cargando...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Configuración de la Empresa
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestiona la información de tu empresa
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6"
      >
        {/* Sección de Logo de la Empresa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Logo de la Empresa
          </label>
          <div className="flex items-start space-x-4">
            <div className="w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-300 dark:border-gray-600">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Company Logo"
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-12 h-12 text-gray-400 dark:text-gray-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <label className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 mr-2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                Subir Logo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Recomendado: Imagen cuadrada, al menos 200x200px
              </p>
            </div>
          </div>
        </div>

        {/* Campos del formulario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre de la Empresa
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              }`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Número de Teléfono
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.phone ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              }`}
            />
            {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Dirección de la Empresa
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.address ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="Ingrese la dirección de la empresa"
            />
            {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.email ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              }`}
            />
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              RUC / Número de Negocio
            </label>
            <input
              type="text"
              value={formData.taxId}
              onChange={(e) => handleInputChange("taxId", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.taxId ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              }`}
            />
            {errors.taxId && <p className="mt-1 text-sm text-red-500">{errors.taxId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sitio Web
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange("website", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.website ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="https://"
            />
            {errors.website && <p className="mt-1 text-sm text-red-500">{errors.website}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Moneda
            </label>
            <input
              type="text"
              value={formData.currency}
              onChange={(e) => handleInputChange("currency", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.currency ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="MXN"
            />
            {errors.currency && <p className="mt-1 text-sm text-red-500">{errors.currency}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tasa de IVA (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.vatRate}
              onChange={(e) =>
                handleInputChange("vatRate", parseFloat(e.target.value))
              }
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.vatRate ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="0.16"
            />
            {errors.vatRate && <p className="mt-1 text-sm text-red-500">{errors.vatRate}</p>}
          </div>
        </div>

        {/* Estado y botón Guardar */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm">
            {hasChanges ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                Hay cambios sin guardar
              </span>
            ) : (
              <span className="text-green-600 dark:text-green-400 font-medium">
                Todos los cambios guardados
              </span>
            )}
          </p>
          <button
            type="submit"
            disabled={updateOrganization.isPending || !hasChanges}
            className={`inline-flex items-center px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              hasChanges
                ? "bg-blue-600 hover:bg-blue-700 text-white active:bg-blue-800"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 mr-2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            {updateOrganization.isPending ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>

      {/* Sección de Configuración de Ticket */}
      <form
        onSubmit={handleTicketLegendsSubmit}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6"
      >
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Configuración de Ticket
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Define las leyendas que aparecen al pie de cada ticket impreso,
            debajo del total. Se imprimen en el orden mostrado abajo, con
            letra más pequeña que el resto del ticket.
          </p>
        </div>

        <div className="space-y-4">
          {ticketLegends.map((legend) => (
            <div
              key={legend.id}
              className="border border-gray-200 dark:border-gray-700 rounded-md p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-4">
                <input
                  type="text"
                  value={legend.label}
                  onChange={(e) =>
                    updateTicketLegend(legend.id, "label", e.target.value)
                  }
                  className="flex-1 px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                  placeholder="Nombre de la leyenda"
                />
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={legend.enabled}
                    onChange={(e) =>
                      updateTicketLegend(legend.id, "enabled", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  Activa
                </label>
              </div>
              <textarea
                value={legend.body}
                onChange={(e) =>
                  updateTicketLegend(legend.id, "body", e.target.value)
                }
                rows={2}
                maxLength={500}
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Texto que se imprimirá al pie del ticket"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm">
            {hasTicketLegendsChanges ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                Hay cambios sin guardar
              </span>
            ) : (
              <span className="text-green-600 dark:text-green-400 font-medium">
                Todos los cambios guardados
              </span>
            )}
          </p>
          <button
            type="submit"
            disabled={updateOrganization.isPending || !hasTicketLegendsChanges}
            className={`inline-flex items-center px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              hasTicketLegendsChanges
                ? "bg-blue-600 hover:bg-blue-700 text-white active:bg-blue-800"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            {updateOrganization.isPending ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>

      {/* Sección de Configuración de la máscara de código (SKU) */}
      <form
        onSubmit={handleSkuMaskSubmit}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6"
      >
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Configuración de la máscara de código
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Define cómo se arma automáticamente el código (SKU) al crear un
            producto: cada segmento puede ser texto fijo, caracteres de la
            categoría raíz (R), la categoría (C), el nombre del producto (P),
            o un consecutivo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {padSkuMaskConfig(skuMaskConfig).map((segment, index) => (
            <div
              key={index}
              className="border border-gray-200 dark:border-gray-700 rounded-md p-3 space-y-2"
            >
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Segmento {index + 1}
              </label>
              <select
                value={segment.type}
                onChange={(e) =>
                  handleSkuMaskTypeChange(index, e.target.value as SkuMaskSegment["type"])
                }
                className="w-full px-2 py-1.5 border rounded-md bg-white dark:bg-gray-700 text-sm border-gray-300 dark:border-gray-600"
              >
                <option value="literal">Texto fijo</option>
                <option value="root">Raíz de categoría (R)</option>
                <option value="category">Categoría (C)</option>
                <option value="product">Nombre de producto (P)</option>
                <option value="sequence">Consecutivo (#)</option>
              </select>

              {segment.type === "literal" && (
                <input
                  type="text"
                  value={segment.value}
                  maxLength={5}
                  onChange={(e) =>
                    updateSkuMaskSlot(index, { type: "literal", value: e.target.value })
                  }
                  placeholder="ej. -"
                  className="w-full px-2 py-1.5 border rounded-md bg-white dark:bg-gray-700 text-sm border-gray-300 dark:border-gray-600"
                />
              )}

              {(segment.type === "root" ||
                segment.type === "category" ||
                segment.type === "product") && (
                <input
                  type="number"
                  min={1}
                  max={4}
                  value={segment.length}
                  onChange={(e) =>
                    updateSkuMaskSlot(index, {
                      type: segment.type,
                      length: Number(e.target.value) || 1,
                    })
                  }
                  className="w-full px-2 py-1.5 border rounded-md bg-white dark:bg-gray-700 text-sm border-gray-300 dark:border-gray-600"
                />
              )}

              {segment.type === "sequence" && (
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={segment.digits}
                  onChange={(e) =>
                    updateSkuMaskSlot(index, {
                      type: "sequence",
                      digits: Number(e.target.value) || 1,
                    })
                  }
                  className="w-full px-2 py-1.5 border rounded-md bg-white dark:bg-gray-700 text-sm border-gray-300 dark:border-gray-600"
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/40 rounded-md p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Vista previa (categoría &quot;Accesorios / Cables&quot;, producto &quot;Cable USB-C&quot;):
          </p>
          <p className="text-lg font-mono font-semibold text-gray-900 dark:text-white">
            {skuMaskPreview || "—"}
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm">
            {hasSkuMaskChanges ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                Hay cambios sin guardar
              </span>
            ) : (
              <span className="text-green-600 dark:text-green-400 font-medium">
                Todos los cambios guardados
              </span>
            )}
          </p>
          <button
            type="submit"
            disabled={updateOrganization.isPending || !hasSkuMaskChanges}
            className={`inline-flex items-center px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              hasSkuMaskChanges
                ? "bg-blue-600 hover:bg-blue-700 text-white active:bg-blue-800"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            {updateOrganization.isPending ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>

      {/* Sección de Configuración de la Empresa */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">
          Acerca de la Configuración de la Empresa
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Estas configuraciones afectan cómo se muestra la información de tu
          empresa en todo el sistema, incluyendo en facturas, recibos y
          comunicaciones con clientes.
        </p>
      </div>
    </div>
  );
}
