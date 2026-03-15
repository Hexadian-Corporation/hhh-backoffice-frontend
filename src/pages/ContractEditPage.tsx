import { useParams } from "react-router"

export default function ContractEditPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Contract</h1>
      <p className="text-[var(--color-text-muted)]">
        Editing contract <strong className="text-[var(--color-text)]">{id}</strong>.
      </p>
    </div>
  )
}
