"use client";

import Wrapper from '@/components/Wrapper';
import { useUser, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from 'react';

interface Client {
  id: string;
  name: string;
}

interface Variant {
  id?: string;
  name: string;
  qte_variante: number;
}

interface Commande {
  value: string;
  variants: Variant[];
}

interface ClientModel {
  id: string;
  name: string;
  description: string;
  commandes: string;
  commandesWithVariants: Commande[];
  lotto: string;
  ordine: string;
  puht: number;
  clientId: string;
  client: Client;
  variants: Variant[];
}

export default function ClientModelPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const email = user?.primaryEmailAddress?.emailAddress;
  const [models, setModels] = useState<ClientModel[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<ClientModel>>({
    name: '',
    description: '',
    commandes: '',
    lotto: '',
    ordine: '',
    puht: 0,
    clientId: '',
    commandesWithVariants: []
  });
  const [commandesWithVariants, setCommandesWithVariants] = useState<Commande[]>([{ value: '', variants: [{ name: '', qte_variante: 0 }] }]);
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (email) fetchData();
    fetchClients();
  }, [email, dateDebut, dateFin, searchTerm, refreshTrigger]);

  const fetchData = async () => {
    if (!email) return;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ email });
    if (dateDebut) params.append('dateDebut', dateDebut);
    if (dateFin) params.append('dateFin', dateFin);
    if (searchTerm) params.append('search', searchTerm);

    try {
      const token = await getToken();
      const res = await fetch(`/api/client-model?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data = await res.json();
      setModels(data);
    } catch (err) {
      setError("Failed to fetch client models");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/client', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = formData.id ? 'PUT' : 'POST';
    const url = '/api/client-model';

    setModalError(null);

    // Combine commandes into a single string for saving
    const combinedCommandes = commandesWithVariants.map(c => c.value).filter(v => v.trim() !== '').join(',');
    const combinedVariants = commandesWithVariants.flatMap((c: Commande) =>
      c.variants
        .filter((v: Variant) => v.name.trim() !== '')
        .map((v: Variant) => ({
          ...v,
          name: `${c.value}:${v.name}`, // e.g., "OPR3328:defaut"
        }))
    );

    try {
      const token = await getToken();
      const payload = {
        ...(formData.id ? { id: formData.id } : { email }),
        name: formData.name || null,
        description: formData.description || null,
        commandes: combinedCommandes || null,
        commandesWithVariants: commandesWithVariants.filter(c => c.value.trim() !== ''),
        variants: combinedVariants,
        lotto: formData.lotto || null,
        ordine: formData.ordine || null,
        puht: formData.puht || null,
        clientId: formData.clientId,
      };

      console.log('Submitting payload:', payload);

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save');
      }

      setIsModalOpen(false);
      setFormData({
        name: '',
        description: '',
        commandes: '',
        commandesWithVariants: [],
        lotto: '',
        ordine: '',
        puht: 0,
        clientId: ''
      });
      setCommandesWithVariants([{ value: '', variants: [{ name: '', qte_variante: 0 }] }]);
      await fetchData();
    } catch (error) {
      console.error('Submission error:', error);
      setModalError("Failed to save client model");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this model?')) {
      try {
        const token = await getToken();
        await fetch(`/api/client-model`, {
          method: 'DELETE',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ id })
        });
        await fetchData();
      } catch (error) {
        console.error('Error deleting:', error);
        setError("Failed to delete client model");
      }
    }
  };

  const handleEdit = (model: ClientModel) => {
    setFormData({
      id: model.id,
      name: model.name || '',
      description: model.description || '',
      commandes: model.commandes || '',
      commandesWithVariants: model.commandesWithVariants || [],
      lotto: model.lotto || '',
      ordine: model.ordine || '',
      puht: model.puht || 0,
      clientId: model.clientId || ''
    });

    // Load commandesWithVariants directly from the model's JSON field
    const loadedCommandesWithVariants = model.commandesWithVariants && Array.isArray(model.commandesWithVariants)
      ? model.commandesWithVariants
      : [{ value: '', variants: [{ name: '', qte_variante: 0 }] }];

    setCommandesWithVariants(loadedCommandesWithVariants);
    setIsModalOpen(true);
  };

  const handleExternalRefresh = () => setRefreshTrigger(prev => prev + 1);

  useEffect(() => {
    (window as any).refreshClientModelPage = handleExternalRefresh;
    return () => {
      delete (window as any).refreshClientModelPage;
    };
  }, []);

  // Deduplicate client models by clientId and name
  const uniqueModels = Array.from(
    new Map(
      models.map((model) => [
        `${model.clientId}-${model.name}`,
        model,
      ])
    ).values()
  );

  return (
    <Wrapper>
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex gap-2 items-center justify-between">
          <button 
            className="btn btn-primary mb-4"
            onClick={() => setIsModalOpen(true)}
          >
            Add Client Model
          </button>

          <div className="flex items-center space-x-2 mb-3.5">
            <input
              type="text"
              placeholder="Search by client or model name"
              className="rounded-xl p-2 bg-gray-100 w-[600px] outline"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 items-center mb-3.5 mr-24">
            <input
              type="date"
              className="input input-bordered"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
            />
            <span>to</span>
            <input
              type="date"
              className="input input-bordered"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
            />
            {(dateDebut || dateFin) && (
              <button 
                className="btn btn-error"
                onClick={() => {
                  setDateDebut('');
                  setDateFin('');
                  fetchData();
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div className="text-center">
            <span className="loading loading-dots loading-lg"></span>
          </div>
        )}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Client</th>
                <th>Model Name</th>
                <th>Commande</th>
                <th>Description</th>
                <th>PUHT</th>
                <th>Variants</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {uniqueModels.map(model => (
                <tr key={model.id}>
                  <td>{model.client?.name || "N/A"}</td>
                  <td>{model.name || "Unnamed"}</td>
                  <td className="flex flex-col">
                    {model.commandesWithVariants && model.commandesWithVariants.length > 0 ? (
                      model.commandesWithVariants.map((cmd, i) => (
                        <div key={i} className="mb-1">
                          {cmd.value || "N/A"}
                          {i < model.commandesWithVariants.length - 1 && (
                            <hr className="border-t border-gray-300 my-1 w-12" />
                          )}
                        </div>
                      ))
                    ) : (
                      <div>{model.commandes || "N/A"}</div>
                    )}
                  </td>
                  <td>{model.description || "N/A"}</td>
                  <td>{model.puht ? `${model.puht} €` : "N/A"}</td>
                  <td className="flex flex-col">
                    {model.commandesWithVariants && model.commandesWithVariants.length > 0 ? (
                      model.commandesWithVariants.map((cmd, i) => (
                        <div key={i} className="mb-1">
                          {cmd.variants && cmd.variants.length > 0 ? (
                            cmd.variants.map((v, j) => (
                              <span key={j} className="mr-2">
                                {v.name} ({v.qte_variante})
                              </span>
                            ))
                          ) : (
                            "N/A"
                          )}
                          {i < model.commandesWithVariants.length - 1 && (
                            <hr className="border-t border-gray-300 my-1 w-12" />
                          )}
                        </div>
                      ))
                    ) : model.variants && model.variants.length > 0 ? (
                      model.variants.map((v, i) => {
                        const [_, variantName] = v.name.includes(':') ? v.name.split(':') : ['', v.name];
                        return (
                          <div key={i} className="mr-1">
                            {variantName} ({v.qte_variante})
                          </div>
                        );
                      })
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-info mr-2"
                      onClick={() => handleEdit(model)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-error"
                      onClick={() => handleDelete(model.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dialog className="modal" open={isModalOpen}>
          <div className="modal-box max-w-3xl">
            <h3 className="font-bold text-lg mb-4">
              {formData.id ? 'Edit' : 'New'} Client Model
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {modalError && (
                <div className="alert alert-error mb-4">
                  {modalError}
                </div>
              )}

              <select
                className="select select-bordered w-full"
                value={formData.clientId || ''}
                onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                required
              >
                <option value="">Select Client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Model Name"
                className="input input-bordered w-full"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required={!formData.id}
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Lotto"
                  className="input input-bordered"
                  value={formData.lotto || ''}
                  onChange={e => setFormData({ ...formData, lotto: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Ordine"
                  className="input input-bordered"
                  value={formData.ordine || ''}
                  onChange={e => setFormData({ ...formData, ordine: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="PUHT"
                  className="input input-bordered"
                  value={formData.puht || 0}
                  onChange={e => setFormData({ ...formData, puht: Number(e.target.value) })}
                  step="0.01"
                />
              </div>

              <textarea
                placeholder="Description"
                className="textarea textarea-bordered w-full"
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />

              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold">Commandes & Variants</h4>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setCommandesWithVariants([...commandesWithVariants, { value: '', variants: [{ name: '', qte_variante: 0 }] }])}
                  >
                    Add Commande
                  </button>
                </div>
                {commandesWithVariants.map((cmd, cmdIndex) => (
                  <div key={cmdIndex} className="mb-4 border-b pb-2">
                    <div className="flex gap-2 items-center mb-2">
                      <input
                        type="text"
                        placeholder="Commande (e.g., 33)"
                        className="input input-bordered w-full"
                        value={cmd.value}
                        onChange={(e) => setCommandesWithVariants(v =>
                          v.map((item, i) =>
                            i === cmdIndex ? { ...item, value: e.target.value } : item
                          )
                        )}
                      />
                      <button
                        type="button"
                        className="btn btn-error btn-sm"
                        onClick={() => setCommandesWithVariants(v => v.filter((_, i) => i !== cmdIndex))}
                        disabled={commandesWithVariants.length === 1}
                      >
                        ×
                      </button>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold">Variants for {cmd.value || 'this commande'}</span>
                      <button
                        type="button"
                        className="btn btn-xs btn-secondary"
                        onClick={() => setCommandesWithVariants(v =>
                          v.map((item, i) =>
                            i === cmdIndex
                              ? { ...item, variants: [...item.variants, { name: '', qte_variante: 0 }] }
                              : item
                          )
                        )}
                      >
                        Add Variant
                      </button>
                    </div>
                    {cmd.variants.map((variant, varIndex) => (
                      <div key={varIndex} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Variant Name"
                          className="input input-bordered flex-1"
                          value={variant.name}
                          onChange={e => setCommandesWithVariants(v =>
                            v.map((item, i) =>
                              i === cmdIndex
                                ? {
                                    ...item,
                                    variants: item.variants.map((v, j) =>
                                      j === varIndex ? { ...v, name: e.target.value } : v
                                    )
                                  }
                                : item
                            )
                          )}
                        />
                        <input
                          type="number"
                          placeholder="Qte"
                          className="input input-bordered w-20"
                          value={variant.qte_variante}
                          onChange={e => setCommandesWithVariants(v =>
                            v.map((item, i) =>
                              i === cmdIndex
                                ? {
                                    ...item,
                                    variants: item.variants.map((v, j) =>
                                      j === varIndex ? { ...v, qte_variante: Number(e.target.value) } : v
                                    )
                                  }
                                : item
                            )
                          )}
                        />
                        <button
                          type="button"
                          className="btn btn-error btn-sm"
                          onClick={() => setCommandesWithVariants(v =>
                            v.map((item, i) =>
                              i === cmdIndex
                                ? {
                                    ...item,
                                    variants: item.variants.filter((_, j) => j !== varIndex)
                                  }
                                : item
                            )
                          )}
                          disabled={cmd.variants.length === 1}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="modal-action">
                <button 
                  type="button" 
                  className="btn"
                  onClick={() => {
                    setIsModalOpen(false);
                    setModalError(null);
                    setFormData({
                      name: '',
                      description: '',
                      commandes: '',
                      commandesWithVariants: [],
                      lotto: '',
                      ordine: '',
                      puht: 0,
                      clientId: ''
                    });
                    setCommandesWithVariants([{ value: '', variants: [{ name: '', qte_variante: 0 }] }]);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {formData.id ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </dialog>
      </div>
    </Wrapper>
  );
}