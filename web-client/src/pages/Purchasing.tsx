import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { apiClient } from '../api/client';
import { DenseTable } from '../components/DenseTable';
import { Title, Badge, SimpleGrid, Paper, Text, Group, ThemeIcon, Loader, Center, Button, Modal, TextInput, Stack } from '@mantine/core';
import { IconTruck, IconPackage, IconBuildingStore, IconPlus } from '@tabler/icons-react';
import { useState } from 'react';

interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  contact_person: string | null;
}

interface PurchaseOrder {
  id: string;
  supplier_id: string;
  order_number: string;
  date: string;
  status: string;
  total_amount: string;
}

const supplierColumnHelper = createColumnHelper<Supplier>();
const supplierColumns = [
  supplierColumnHelper.accessor('name', { header: 'Supplier Name' }),
  supplierColumnHelper.accessor('contact_person', { header: 'Contact Person', cell: info => info.getValue() || '—' }),
  supplierColumnHelper.accessor('email', { header: 'Email', cell: info => info.getValue() || '—' }),
  supplierColumnHelper.accessor('phone', { header: 'Phone', cell: info => info.getValue() || '—' }),
];

const poColumnHelper = createColumnHelper<PurchaseOrder>();
const poColumns = [
  poColumnHelper.accessor('order_number', { header: 'Order #' }),
  poColumnHelper.accessor('date', { header: 'Date', cell: info => new Date(info.getValue()).toLocaleDateString() }),
  poColumnHelper.accessor('status', {
    header: 'Status',
    cell: info => {
      const status = info.getValue();
      const color = status === 'RECEIVED' ? 'green' : status === 'ORDERED' ? 'blue' : status === 'CANCELLED' ? 'red' : 'gray';
      return <Badge color={color} size="sm">{status}</Badge>;
    },
  }),
  poColumnHelper.accessor('total_amount', { header: 'Total', cell: info => `$${Number(info.getValue()).toLocaleString()}` }),
];

export function Purchasing() {
  const { data: suppliers, isLoading: loadingSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const r = await apiClient.get<Supplier[]>('/purchasing/suppliers');
      return r.data;
    },
  });

  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      const r = await apiClient.get<PurchaseOrder[]>('/purchasing/orders');
      return r.data;
    },
  });

  const s = suppliers || [];
  const o = orders || [];
  const received = o.filter(x => x.status === 'RECEIVED').length;
  const totalValue = o.reduce((sum, x) => sum + Number(x.total_amount), 0);

  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', contact_person: '' });

  const createMut = useMutation({
    mutationFn: (data: any) => apiClient.post('/purchasing/suppliers', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); setAddOpen(false); setForm({ name: '', email: '', phone: '', address: '', contact_person: '' }); },
  });

  if (loadingSuppliers || loadingOrders) {
    return <Center h={300}><Loader size="lg" /></Center>;
  }

  return (
    <div style={{ padding: 20 }}>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Purchasing</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => setAddOpen(true)}>New Vendor</Button>
      </Group>

      <SimpleGrid cols={3} mb="xl">
        <Paper withBorder p="md" radius="md">
          <Group>
            <ThemeIcon size={40} radius="md" variant="light" color="blue">
              <IconBuildingStore size={24} />
            </ThemeIcon>
            <div>
              <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Suppliers</Text>
              <Text fw={700} size="xl">{s.length}</Text>
            </div>
          </Group>
        </Paper>
        <Paper withBorder p="md" radius="md">
          <Group>
            <ThemeIcon size={40} radius="md" variant="light" color="violet">
              <IconPackage size={24} />
            </ThemeIcon>
            <div>
              <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Purchase Orders</Text>
              <Text fw={700} size="xl">{o.length} ({received} received)</Text>
            </div>
          </Group>
        </Paper>
        <Paper withBorder p="md" radius="md">
          <Group>
            <ThemeIcon size={40} radius="md" variant="light" color="teal">
              <IconTruck size={24} />
            </ThemeIcon>
            <div>
              <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Total PO Value</Text>
              <Text fw={700} size="xl">${totalValue.toLocaleString()}</Text>
            </div>
          </Group>
        </Paper>
      </SimpleGrid>

      <Title order={4} mb="sm">Suppliers</Title>
      <Paper withBorder mb="xl" radius="md" style={{ overflow: 'hidden' }}>
        <DenseTable data={s} columns={supplierColumns} />
      </Paper>

      <Title order={4} mb="sm">Purchase Orders</Title>
      <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
        <DenseTable data={o} columns={poColumns} />
      </Paper>

      <Modal opened={addOpen} onClose={() => setAddOpen(false)} title="New Vendor" centered size="md">
        <Stack>
          <TextInput label="Company Name" required value={form.name} onChange={(e: any) => setForm({ ...form, name: e.currentTarget.value })} />
          <TextInput label="Contact Person" value={form.contact_person} onChange={(e: any) => setForm({ ...form, contact_person: e.currentTarget.value })} />
          <TextInput label="Email" value={form.email} onChange={(e: any) => setForm({ ...form, email: e.currentTarget.value })} />
          <TextInput label="Phone" value={form.phone} onChange={(e: any) => setForm({ ...form, phone: e.currentTarget.value })} />
          <TextInput label="Address" value={form.address} onChange={(e: any) => setForm({ ...form, address: e.currentTarget.value })} />
          <Button onClick={() => createMut.mutate(form)} loading={createMut.isPending} disabled={!form.name}>Create Vendor</Button>
        </Stack>
      </Modal>
    </div>
  );
}
