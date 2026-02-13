import { useState } from "react";
import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { mapSiteInfoApiToForm, mapFormToSiteInfoApi } from "@/lib/siteInfoMapper";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Clock, Power } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface DaySchedule {
  enabled: boolean;
  openTime: string;
  closeTime: string;
}

interface BusinessHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export default function BusinessHoursSettings() {
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  // Commencer avec des données vides - sera rempli depuis la base de données
  const [formData, setFormData] = useState<BusinessHours>({
    monday: { enabled: false, openTime: "09:00", closeTime: "17:00" },
    tuesday: { enabled: false, openTime: "09:00", closeTime: "17:00" },
    wednesday: { enabled: false, openTime: "09:00", closeTime: "17:00" },
    thursday: { enabled: false, openTime: "09:00", closeTime: "17:00" },
    friday: { enabled: false, openTime: "09:00", closeTime: "17:00" },
    saturday: { enabled: false, openTime: "09:00", closeTime: "17:00" },
    sunday: { enabled: false, openTime: "09:00", closeTime: "17:00" }
  });

  const { data: siteInfo, isLoading, error } = useQuery({
    queryKey: ["/api/admin/site-info"],
    queryFn: () => apiRequest("GET", "/api/admin/site-info"),
  });

  const updateSiteInfoMutation = useMutation({
    mutationFn: (data: BusinessHours) => {
      // Convertir le nouveau format en format pour l'API
      const formatScheduleForApi = (schedule: DaySchedule) => {
        if (!schedule.enabled) return "Fermé";
        return `${schedule.openTime} - ${schedule.closeTime}`;
      };

      // Envoyer les horaires comme champs individuels comme attendu par l'API
      const apiData = {
        mondayHours: formatScheduleForApi(data.monday),
        tuesdayHours: formatScheduleForApi(data.tuesday), 
        wednesdayHours: formatScheduleForApi(data.wednesday),
        thursdayHours: formatScheduleForApi(data.thursday),
        fridayHours: formatScheduleForApi(data.friday),
        saturdayHours: formatScheduleForApi(data.saturday),
        sundayHours: formatScheduleForApi(data.sunday)
      };
      
      console.log("📤 Envoi données horaires:", apiData);
      
      return apiRequest("PATCH", "/api/admin/site-info", mapFormToSiteInfoApi(apiData));
    },
    onSuccess: (result) => {
      console.log("✅ Sauvegarde réussie:", result);
      // Attendre un peu avant d'invalider le cache pour s'assurer que la DB est à jour
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/site-info"] });
      }, 500);
      setHasChanges(false);
      toast({
        title: "✅ Horaires sauvegardées",
        description: "Les horaires d'ouverture ont été mises à jour avec succès.",
      });
    },
    onError: (error) => {
      console.error("Erreur lors de la sauvegarde:", error);
      toast({
        variant: "destructive",
        title: "❌ Erreur de sauvegarde",
        description: "Impossible de sauvegarder les horaires d'ouverture.",
      });
    }
  });

  React.useEffect(() => {
    if (siteInfo) {
      const mappedData = mapSiteInfoApiToForm(siteInfo);
      const hours = mappedData.businessHours || {};
      
      // Vérifier le type de données d'horaires
      console.log("🔍 Debug horaires reçues:", hours, typeof hours);
      
      // Convertir les anciennes données texte en nouveau format si nécessaire
      const parseOldFormat = (dayText: any) => {
        // Vérifier que dayText est une chaîne valide
        if (!dayText || typeof dayText !== 'string' || dayText === "Fermé" || dayText === "") {
          return { enabled: false, openTime: "09:00", closeTime: "17:00" };
        }
        
        // Parser format "9h00 - 17h00" ou "09:00 - 17:00"
        const timeMatch = dayText.match(/(\d{1,2})[h:]?(\d{2})?\s*-\s*(\d{1,2})[h:]?(\d{2})?/);
        if (timeMatch) {
          const openHour = timeMatch[1].padStart(2, '0');
          const openMin = timeMatch[2] || '00';
          const closeHour = timeMatch[3].padStart(2, '0');
          const closeMin = timeMatch[4] || '00';
          
          return {
            enabled: true,
            openTime: `${openHour}:${openMin}`,
            closeTime: `${closeHour}:${closeMin}`
          };
        }
        
        return { enabled: false, openTime: "09:00", closeTime: "17:00" };
      };
      
      // Fonction helper pour extraire les données de manière sécurisée
      const getHourData = (dayKey: string) => {
        const variants = [dayKey, dayKey.substring(0, 3)]; // ex: "monday", "mon"
        for (const variant of variants) {
          if (hours[variant]) {
            return hours[variant];
          }
        }
        return "";
      };
      
      const newFormData = {
        monday: parseOldFormat(getHourData("monday")),
        tuesday: parseOldFormat(getHourData("tuesday")),
        wednesday: parseOldFormat(getHourData("wednesday")),
        thursday: parseOldFormat(getHourData("thursday")),
        friday: parseOldFormat(getHourData("friday")),
        saturday: parseOldFormat(getHourData("saturday")),
        sunday: parseOldFormat(getHourData("sunday"))
      };
      
      console.log("📝 Mise à jour des données depuis l'API:", newFormData);
      setFormData(newFormData);
      setHasChanges(false);
    }
  }, [siteInfo]);

  const handleDayToggle = (day: keyof BusinessHours, enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled }
    }));
    setHasChanges(true);
  };

  const handleTimeChange = (day: keyof BusinessHours, timeType: 'openTime' | 'closeTime', value: string) => {
    setFormData(prev => ({
      ...prev,
      [day]: { ...prev[day], [timeType]: value }
    }));
    setHasChanges(true);
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute of ['00', '30']) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute}`;
        const displayTime = hour === 0 ? `00:${minute}` : `${hour.toString().padStart(2, '0')}:${minute}`;
        options.push({ value: timeString, label: displayTime });
      }
    }
    return options;
  };

  const TimeSelector = ({ value, onChange, label }: { value: string, onChange: (value: string) => void, label: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const timeOptions = generateTimeOptions();

    return (
      <div className="relative">
        <Label className="text-xs text-gray-600 mb-1 block">{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="w-20 h-8 text-xs justify-center"
        >
          {value}
        </Button>
        {isOpen && (
          <div className="absolute z-50 top-full left-0 mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
            <div className="grid grid-cols-4 gap-1 p-2">
              {timeOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={value === option.value ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteInfoMutation.mutate(formData);
  };

  const dayLabels = {
    monday: "Lundi",
    tuesday: "Mardi", 
    wednesday: "Mercredi",
    thursday: "Jeudi",
    friday: "Vendredi",
    saturday: "Samedi",
    sunday: "Dimanche"
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horaires d'ouverture
          </CardTitle>
          <CardDescription>
            Configuration des horaires d'ouverture par jour
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({length: 7}).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Horaires d'ouverture
        </CardTitle>
        <CardDescription>
          Configuration des horaires d'ouverture par jour. Toggle pour activer/désactiver, clic sur les heures pour modifier.
        </CardDescription>
        {hasChanges && (
          <Badge variant="secondary" className="w-fit">
            Modifications non sauvegardées
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Liste des jours */}
          <div className="space-y-3">
            {Object.entries(dayLabels).map(([day, label]) => {
              const dayKey = day as keyof BusinessHours;
              const schedule = formData[dayKey];
              
              return (
                <div key={day} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {/* Toggle pour activer/désactiver */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={schedule.enabled}
                        onCheckedChange={(enabled) => handleDayToggle(dayKey, enabled)}
                      />
                      <Label className="font-medium min-w-[80px]">{label}</Label>
                    </div>
                    
                    {/* Status */}
                    <div className="flex items-center gap-2">
                      {schedule.enabled ? (
                        <Badge variant="default" className="bg-green-500">
                          <Power className="w-3 h-3 mr-1" />
                          Ouvert
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Fermé
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Sélecteurs d'heures */}
                  {schedule.enabled && (
                    <div className="flex items-center gap-3">
                      <TimeSelector
                        value={schedule.openTime}
                        onChange={(value) => handleTimeChange(dayKey, 'openTime', value)}
                        label="Ouverture"
                      />
                      <span className="text-gray-400 text-sm">→</span>
                      <TimeSelector
                        value={schedule.closeTime}
                        onChange={(value) => handleTimeChange(dayKey, 'closeTime', value)}
                        label="Fermeture"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Actions rapides */}
          <div className="border-t pt-4">
            <Label className="text-sm font-medium mb-3 block">Actions rapides</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const weekdaySchedule = { enabled: true, openTime: "09:00", closeTime: "17:00" };
                  const weekendSchedule = { enabled: false, openTime: "09:00", closeTime: "17:00" };
                  setFormData({
                    monday: weekdaySchedule,
                    tuesday: weekdaySchedule,
                    wednesday: weekdaySchedule,
                    thursday: weekdaySchedule,
                    friday: weekdaySchedule,
                    saturday: weekendSchedule,
                    sunday: weekendSchedule
                  });
                  setHasChanges(true);
                }}
              >
                Lun-Ven 9h-17h
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const restaurantSchedule = { enabled: true, openTime: "11:00", closeTime: "22:00" };
                  const weekendSchedule = { enabled: true, openTime: "17:00", closeTime: "23:00" };
                  setFormData({
                    monday: restaurantSchedule,
                    tuesday: restaurantSchedule,
                    wednesday: restaurantSchedule,
                    thursday: restaurantSchedule,
                    friday: restaurantSchedule,
                    saturday: weekendSchedule,
                    sunday: { enabled: false, openTime: "09:00", closeTime: "17:00" }
                  });
                  setHasChanges(true);
                }}
              >
                Restaurant type
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  Object.keys(formData).forEach(day => {
                    handleDayToggle(day as keyof BusinessHours, false);
                  });
                }}
              >
                Tout fermer
              </Button>
            </div>
          </div>

          {/* Bouton de sauvegarde */}
          <div className="flex justify-end pt-4 border-t">
            <Button 
              type="submit" 
              disabled={!hasChanges || updateSiteInfoMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {updateSiteInfoMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}