import { Title, Table, Paper, Group, Text, Badge, SimpleGrid, Card, ThemeIcon, TextInput, Button, Modal, Stack } from '@mantine/core';
import { IconFileText, IconPlus, IconSearch } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useState } from 'react';

const STATUS_COLORS: Record<string, string> = { PENDING: 'yellow', ACCEPTED: 'green', REJECTED: 'red', CONVERTED: 'blue', EXPIRED: 'gray' };

export function Estimates() {
    const [search, setSearch] = useState('');
    const [addOpen, setAddOpen] = useState(false);
    const [form, setForm] = useState({ customer_id: '', estimate_number: '', total_amount: 0, notes: '' });
    const queryClient = useQueryClient();

    const { data: estimates = [] } = useQuery({ queryKey: ['estimates'], queryFn: async () => (await apiClient.get('/estimates')).data });
    const createMut = useMutation({ mutationFn: (d: any) => apiClient.post('/estimates', d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['estimates'] }); setAddOpen(false); } });

    const filtered = estimates.filter((e: any) => e.estimate_number.toLowerCase().includes(search.toLowerCase()));
    const pending = estimates.filter((e: any) => e.status === 'PENDING').length;
    const totalValue = estimates.reduce((s: number, e: any) => s + Number(e.total_amount), 0);

    return (
        <div>
            <Group justify="space-between" mb="md">
                <Title order={2}>Estimates / Quotes</Title>
                <Button leftSection={<IconPlus size={16} />} onClick={() => setAddOpen(true)}>New Estimate</Button>
            </Group>
            <SimpleGrid cols={3} mb="lg">
                {[
                    { label: 'TOTAL ESTIMATES', value: estimates.length, color: 'blue' },
                    { label: 'PENDING', value: pending, color: 'yellow' },
                    { label: 'TOTAL VALUE', value: `$${totalValue.toLocaleString()}`, color: 'green' },
                ].map(s => (
                    <Card key={s.label} withBorder radius="md" p="md"><Group><ThemeIcon variant="light" color={s.color} size="lg"><IconFileText size={20} /></ThemeIcon><div><Text size="xs" tt="uppercase" c="dimmed" fw={700}>{s.label}</Text><Text size="lg" fw={700}>{s.value}</Text></div></Group></Card>
                ))}
            </SimpleGrid>
            <TextInput placeholder="Search estimates..." leftSection={<IconSearch size={16} />} value={search} onChange={e => setSearch(e.currentTarget.value)} mb="md" />
            <Paper withBorder radius="md">
                <Table striped highlightOnHover>
                    <Table.Thead><Table.Tr><Table.Th>Estimate #</Table.Th><Table.Th>Date</Table.Th><Table.Th>Expiration</Table.Th><Table.Th>Amount</Table.Th><Table.Th>Status</Table.Th><Table.Th>Notes</Table.Th></Table.Tr></Table.Thead>
                    <Table.Tbody>
                        {filtered.map((e: any) => (
                            <Table.Tr key={e.id}>
                                <Table.Td><Text fw={500}>{e.estimate_number}</Text></Table.Td>
                                <Table.Td>{new Date(e.date).toLocaleDateString()}</Table.Td>
                                <Table.Td>{e.expiration_date ? new Date(e.expiration_date).toLocaleDateString() : '—'}</Table.Td>
                                <Table.Td>${Number(e.total_amount).toLocaleString()}</Table.Td>
                                <Table.Td><Badge color={STATUS_COLORS[e.status] || 'gray'} variant="light" size="sm">{e.status}</Badge></Table.Td>
                                <Table.Td><Text size="sm" c="dimmed" lineClamp={1}>{e.notes || '—'}</Text></Table.Td>
                            </Table.Tr>
                        ))}
                        {filtered.length === 0 && <Table.Tr><Table.Td colSpan={6}><Text ta="center" c="dimmed" py="xl">No estimates found</Text></Table.Td></Table.Tr>}
                    </Table.Tbody>
                </Table>
            </Paper>
            <Modal opened={addOpen} onClose={() => setAddOpen(false)} title="New Estimate" centered>
                <Stack>
                    <TextInput label="Estimate Number" required value={form.estimate_number} onChange={e => setForm({ ...form, estimate_number: e.currentTarget.value })} />
                    <TextInput label="Total Amount" type="number" value={String(form.total_amount)} onChange={e => setForm({ ...form, total_amount: Number(e.currentTarget.value) })} />
                    <TextInput label="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.currentTarget.value })} />
                    <Button onClick={() => createMut.mutate(form)} loading={createMut.isPending}>Create Estimate</Button>
                </Stack>
            </Modal>
        </div>
    );
}
