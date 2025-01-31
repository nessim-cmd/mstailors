import { Livraison } from '@/type'
import { LivraisonLine } from '@prisma/client'
import { Plus, Trash } from 'lucide-react'
import React from 'react'

interface Props {
    livraison: Livraison
    setLivraison: (livraison: Livraison) => void
}

const LivraisonLines: React.FC<Props> = ({ livraison, setLivraison }) => {
    const handleAddLine = () => {
        const newLine: LivraisonLine = {
            id: `${Date.now()}`,
            modele: '',
            commande: '',
            description: "",
            quantity: 1,
            livraisonId: livraison.id,
        }
        setLivraison({
            ...livraison,
            lines: [...livraison.lines, newLine]
        })
    }

    const handleModeleChange = (index: number, value: string) => {
        const updatedLines = [...livraison.lines]
        updatedLines[index].modele = value
        setLivraison({ ...livraison, lines: updatedLines })
    }

    const handleCommandeChange = (index: number, value: string) => {
        const updatedLines = [...livraison.lines]
        updatedLines[index].commande = value
        setLivraison({ ...livraison, lines: updatedLines })
    }

    const handleDescriptionChange = (index: number, value: string) => {
        const updatedLines = [...livraison.lines]
        updatedLines[index].description = value
        setLivraison({ ...livraison, lines: updatedLines })
    }

    const handleQuantityChange = (index: number, value: string) => {
        const updatedLines = [...livraison.lines]
        updatedLines[index].quantity = value === "" ? 0 : parseInt(value)
        setLivraison({ ...livraison, lines: updatedLines })
    }

    const handleRemoveLine = (index: number) => {
        const updatedLines = livraison.lines.filter((_, i) => i !== index)
        setLivraison({ ...livraison, lines: updatedLines })
    }

    return (
        <div className='h-fit bg-base-200 p-5 rounded-xl w-full'>
            <div className='flex justify-between items-center mb-4'>
                <h2 className='badge badge-accent'>Articles</h2>
                <button
                    className='btn btn-sm btn-accent'
                    onClick={handleAddLine}
                >
                    <Plus className='w-4' />
                </button>
            </div>

            <div className='scrollable'>
                <table className='table w-full'>
                    <thead className='uppercase'>
                        <tr>
                            <th>Modèle</th>
                            <th>Commande</th>
                            <th>Description</th>
                            <th>Quantité</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {livraison.lines.map((line, index) => (
                            <tr key={line.id} >
                                <td>
                                    <input
                                        type="text"
                                        value={line.modele}
                                        className='input input-sm input-bordered w-full'
                                        onChange={(e) => handleModeleChange(index, e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        value={line.commande}
                                        className='input input-sm input-bordered w-full'
                                        onChange={(e) => handleCommandeChange(index, e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        value={line.description}
                                        className='input input-sm input-bordered w-full'
                                        onChange={(e) => handleDescriptionChange(index, e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        value={line.quantity}
                                        className='input input-sm input-bordered w-full'
                                        min={0}
                                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                                    />
                                </td>
                                <td>
                                    <button
                                        onClick={() => handleRemoveLine(index)}
                                        className='btn btn-sm btn-circle btn-accent'>
                                        <Trash className="w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default LivraisonLines