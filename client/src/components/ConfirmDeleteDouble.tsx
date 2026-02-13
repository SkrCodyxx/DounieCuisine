import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ConfirmDeleteDoubleProps {
  trigger: React.ReactNode;
  title?: string;
  description?: string;
  confirmWord?: string; // default: SUPPRIMER
  confirmLabel?: string; // default: Supprimer définitivement
  onConfirm: () => void | Promise<void>;
  itemName?: string;
  extraInfo?: React.ReactNode;
}

export default function ConfirmDeleteDouble({
  trigger,
  title = "Confirmer la suppression",
  description = "Cette action est irréversible.",
  confirmWord = "SUPPRIMER",
  confirmLabel = "Supprimer définitivement",
  onConfirm,
  itemName,
  extraInfo,
}: ConfirmDeleteDoubleProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [typed, setTyped] = useState("");
  const matches = typed.trim().toUpperCase() === confirmWord.toUpperCase();

  const reset = () => {
    setStep(1);
    setTyped("");
  };

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) reset();
  };

  const proceed = async () => {
    await onConfirm();
    setOpen(false);
    reset();
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <span onClick={() => setOpen(true)}>{trigger}</span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
            {itemName ? (
              <>
                <br />
                <span className="font-medium">{itemName}</span>
              </>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {extraInfo ? <div className="text-sm text-muted-foreground mt-1">{extraInfo}</div> : null}
        {step === 1 ? (
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <Button variant="destructive" onClick={() => setStep(2)}>Continuer</Button>
          </AlertDialogFooter>
        ) : (
          <>
            <div className="space-y-2 py-2">
              <Label className="text-sm">Pour confirmer, tapez « {confirmWord} »</Label>
              <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={confirmWord} />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button variant="destructive" disabled={!matches} onClick={proceed}>
                  {confirmLabel}
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
