
import { Toaster as SonnerPrimitive, toast } from "sonner" // Renamed import to SonnerPrimitive for clarity

type ToasterProps = React.ComponentProps<typeof SonnerPrimitive>

const CustomSonnerToaster = ({ theme = "system", ...props }: ToasterProps) => {
  return (
    <SonnerPrimitive
      theme={theme} // Use the theme prop (defaults to "system")
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

// Exporting with the original name 'Toaster' so App.tsx doesn't need to change its import alias
export { CustomSonnerToaster as Toaster, toast }

