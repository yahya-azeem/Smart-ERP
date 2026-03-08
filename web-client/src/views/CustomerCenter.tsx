import { Grid, Paper, Title, Text, Group, ScrollArea, Table, Button, TextInput, Avatar, Stack, Badge, Modal, SimpleGrid, Card, ThemeIcon } from '@mantine/core';
import { useState } from 'react';
import { IconSearch, IconPlus, IconPhone, IconMail, IconMapPin, IconUsers } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useWindowManager } from '../context/WindowManagerContext';
import { Accounting } from './Accounting';

function fmt(v: any) { return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` }

export function CustomerCenter() {
  const queryClient = useQueryClient();
  const { openTab } = useWindowManager();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });

  // Live API data
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => (await apiClient.get('/sales/customers')).data,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['customer-invoices'],
    queryFn: async () => { try { return (await apiClient.get('/accounting/invoices')).data; } catch { return []; } },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/sales/customers', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }); setAddOpen(false); setForm({ name: '', email: '', phone: '', address: '' }); },
  });

  const selected = customers.find((c: any) => c.id === selectedId) || customers[0];
  const filteredCustomers = customers.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Get invoices for selected customer
  const customerInvoices = invoices.filter((inv: any) => inv.customer_id === selected?.id);
  const totalBalance = customerInvoices.reduce((s: number, i: any) => s + Number(i.total_amount) - Number(i.amount_paid), 0);

  // Stats
  const totalOutstanding = invoices.reduce((s: number, i: any) => s + Number(i.total_amount) - Number(i.amount_paid), 0);
  const overdue = invoices.filter((i: any) => (i.status || '').toUpperCase() === 'OVERDUE').length;

  return (
    <div style={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      <Group justify="space-between" mb="md">
        <Title order={3}>Customer Center</Title>
        <Group>
          <Button leftSection={<IconPlus size={16} />} onClick={() => setAddOpen(true)}>New Customer</Button>
          <Button variant="light" onClick={() => openTab('invoices', 'Invoices', <Accounting />)}>New Transaction</Button>
        </Group>
      </Group>

      <SimpleGrid cols={3} mb="md">
        <Card withBorder radius="md" p="sm">
          <Group><ThemeIcon variant="light" color="blue" size="lg"><IconUsers size={20} /></ThemeIcon>
            <div><Text size="xs" tt="uppercase" c="dimmed" fw={700}>CUSTOMERS</Text><Text size="lg" fw={700}>{customers.length}</Text></div></Group>
        </Card>
        <Card withBorder radius="md" p="sm">
          <Text size="xs" tt="uppercase" c="dimmed" fw={700}>OUTSTANDING</Text><Text size="lg" fw={700} c="red">{fmt(totalOutstanding)}</Text>
        </Card>
        <Card withBorder radius="md" p="sm">
          <Text size="xs" tt="uppercase" c="dimmed" fw={700}>OVERDUE</Text><Text size="lg" fw={700} c="orange">{overdue} invoices</Text>
        </Card>
      </SimpleGrid>

      <Grid style={{ flex: 1, overflow: 'hidden' }}>
        <Grid.Col span={3} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <TextInput
            placeholder="Search customers"
            leftSection={<IconSearch size={16} />}
            mb="xs"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
          <Paper withBorder style={{ flex: 1 }} p={0}>
            <ScrollArea h="100%">
              {filteredCustomers.map((c: any) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  style={{
                    padding: '10px 15px',
                    cursor: 'pointer',
                    backgroundColor: (selected?.id === c.id) ? 'var(--mantine-color-blue-light)' : 'transparent',
                    borderBottom: '1px solid var(--mantine-color-dark-4)'
                  }}
                >
                  <Text fw={500} size="sm">{c.name}</Text>
                  <Text size="xs" c="dimmed">{c.email || 'No email'}</Text>
                </div>
              ))}
              {filteredCustomers.length === 0 && <Text ta="center" c="dimmed" py="xl">No customers found</Text>}
            </ScrollArea>
          </Paper>
        </Grid.Col>

        <Grid.Col span={9} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {selected ? (
            <>
              <Paper withBorder p="md" mb="md" radius="md">
                <Group align="flex-start">
                  <Avatar size="lg" color="blue">{selected.name?.charAt(0)}</Avatar>
                  <div style={{ flex: 1 }}>
                    <Title order={4}>{selected.name}</Title>
                    <Group mt="xs" gap="xl">
                      <Group gap={5}><IconMail size={16} color="gray" /><Text size="sm">{selected.email || '—'}</Text></Group>
                      <Group gap={5}><IconPhone size={16} color="gray" /><Text size="sm">{selected.phone || '—'}</Text></Group>
                      <Group gap={5}><IconMapPin size={16} color="gray" /><Text size="sm">{selected.address || '—'}</Text></Group>
                    </Group>
                  </div>
                  <Stack align="flex-end" gap={0}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Open Balance</Text>
                    <Title order={3} c={totalBalance > 0 ? 'red' : 'green'}>{fmt(totalBalance)}</Title>
                  </Stack>
                </Group>
              </Paper>

              <Paper withBorder style={{ flex: 1 }} p={0} radius="md">
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Date</Table.Th><Table.Th>Type</Table.Th><Table.Th>Num</Table.Th>
                      <Table.Th>Status</Table.Th><Table.Th style={{ textAlign: 'right' }}>Total</Table.Th>
                      <Table.Th style={{ textAlign: 'right' }}>Paid</Table.Th><Table.Th style={{ textAlign: 'right' }}>Balance</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {customerInvoices.map((t: any) => (
                      <Table.Tr key={t.id}>
                        <Table.Td>{t.date?.slice(0, 10)}</Table.Td>
                        <Table.Td>Invoice</Table.Td>
                        <Table.Td fw={500}>{t.invoice_number}</Table.Td>
                        <Table.Td>
                          <Badge color={(t.status || '').toUpperCase() === 'PAID' ? 'green' : (t.status || '').toUpperCase() === 'OVERDUE' ? 'red' : (t.status || '').toUpperCase() === 'SENT' ? 'blue' : 'gray'} variant="light" size="sm">{(t.status || '').toUpperCase()}</Badge>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>{fmt(t.total_amount)}</Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>{fmt(t.amount_paid)}</Table.Td>
                        <Table.Td style={{ textAlign: 'right' }} c={Number(t.total_amount) - Number(t.amount_paid) > 0 ? 'red' : 'green'}>
                          {fmt(Number(t.total_amount) - Number(t.amount_paid))}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                    {customerInvoices.length === 0 && (
                      <Table.Tr><Table.Td colSpan={7}><Text ta="center" c="dimmed" py="xl">No transactions for this customer</Text></Table.Td></Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Paper>
            </>
          ) : (
            <Paper withBorder p="xl" radius="md"><Text ta="center" c="dimmed">Select a customer to view details</Text></Paper>
          )}
        </Grid.Col>
      </Grid>

      <Modal opened={addOpen} onClose={() => setAddOpen(false)} title="New Customer" centered size="md">
        <Stack>
          <TextInput label="Company Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.currentTarget.value })} />
          <TextInput label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.currentTarget.value })} />
          <TextInput label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.currentTarget.value })} />
          <TextInput label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.currentTarget.value })} />
          <Button onClick={() => createMutation.mutate(form)} loading={createMutation.isPending} disabled={!form.name}>
            Create Customer
          </Button>
        </Stack>
      </Modal>
    </div>
  );
}
