import { useEffect } from "react";
import { useForm, UseFormProps, UseFormReturn, FieldValues, DefaultValues } from "react-hook-form";

/**
 * Hook personnalisé qui synchronise automatiquement un formulaire react-hook-form
 * avec les données du serveur (provenant de useQuery).
 * 
 * Quand les données du serveur changent (après une mutation réussie et invalidation
 * du cache), le formulaire se met automatiquement à jour avec form.reset().
 * 
 * @param data - Données du serveur (de useQuery)
 * @param formOptions - Options react-hook-form standard
 * @returns Instance du formulaire react-hook-form
 * 
 * @example
 * const { data: siteInfo } = useQuery({ queryKey: ["/api/site-info"] });
 * const form = useSyncedForm(siteInfo, {
 *   defaultValues: { businessName: "", tagline: "" }
 * });
 */
export function useSyncedForm<TFieldValues extends FieldValues = FieldValues>(
  data: TFieldValues | undefined,
  formOptions?: Omit<UseFormProps<TFieldValues>, "defaultValues"> & {
    defaultValues?: DefaultValues<TFieldValues>;
  }
): UseFormReturn<TFieldValues> {
  // Créer le formulaire avec les options fournies
  const form = useForm<TFieldValues>(formOptions);

  // Synchroniser le formulaire quand les données changent
  useEffect(() => {
    if (data) {
      // Reset le formulaire avec les nouvelles données du serveur
      // Cela met à jour visuellement tous les inputs contrôlés
      form.reset(data as DefaultValues<TFieldValues>, {
        keepDirty: false,  // Réinitialiser l'état "dirty"
        keepTouched: false, // Réinitialiser l'état "touched"
      });
    }
  }, [data, form]);

  return form;
}
