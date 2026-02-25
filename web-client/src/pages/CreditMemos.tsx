import { Title, Table, Paper, Group, Text, Badge, SimpleGrid, Card, ThemeIcon, TextInput } from '@mantine/core';
import { IconCreditCard, IconSearch } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useState } from 'react';

const STATUS_COLORS: Record<string, string> = { OPEN: 'blue', APPLIED: 'green', REFUNDED: 'violet' };

export function CreditMemos() {
    const [search, setSearch] = useState('');
    const { data: memos = [] } = useQuery({ queryKey: ['credit-memos'], queryFn: async () => (await apiClient.get('/credit-memos')).data });

    const filtered = memos.filter((m: any) => m.memo_number.toLowerCase().includes(search.toLowerCase()));
    const total = memos.reduce((s: number, m: any) => s + Number(m.total_amount), 0);
    const openCount = memos.filter((m: any) => m.status === 'OPEN').length;

    return (
        <div>
            <Group justify="space-between" mb="md"><Title order={2}>Credit Memos / Refunds</Title></Group>
            <SimpleGrid cols={3} mb="lg">
                <Card withBorder radius="md" p="md"><Group><ThemeIcon variant="light" color="violet" size="lg"><IconCreditCard size={20} /></ThemeIcon><div><Text size="xs" tt="uppercase" c="dimmed" fw={700}>TOTAL MEMOS</Text><Text size="lg" fw={700}>{memos.length}</Text></div></Group></Card>
                <Card withBorder radius="md" p="md"><Group><ThemeIcon variant="light" color="blue" size="lg"><IconCreditCard size={20} /></ThemeIcon><div><Text size="xs" tt="uppercase" c="dimmed" fw={700}>OPEN</Text><Text size="lg" fw={700}>{openCount}</Text></div></Group></Card>
                <Card withBorder radius="md" p="md"><Group><ThemeIcon variant="light" color="red" size="lg"><IconCreditCard size={20} /></ThemeIcon><div><Text size="xs" tt="uppercase" c="dimmed" fw={700}>TOTAL CREDITS</Text><Text size="lg" fw={700}>${total.toLocaleString()}</Text></div></Group></Card>
            </SimpleGrid>
            <TextInput placeholder="Search..." leftSection={<IconSearch size={16} />} value={search} onChange={e => setSearch(e.currentTarget.value)} mb="md" />
            <Paper withBorder radius="md">
                <Table striped highlightOnHover>
                    <Table.Thead><Table.Tr><Table.Th>Memo #</Table.Th><Table.Th>Date</Table.Th><Table.Th>Amount</Table.Th><Table.Th>Status</Table.Th><Table.Th>Notes</Table.Th></Table.Tr></Table.Thead>
                    <Table.Tbody>
                        {filtered.map((m: any) => (
                            <Table.Tr key={m.id}>
                                <Table.Td><Text fw={500}>{m.memo_number}</Text></Table.Td>
                                <Table.Td>{new Date(m.date).toLocaleDateString()}</Table.Td>
                                <Table.Td>${Number(m.total_amount).toLocaleString()}</Table.Td>
                                <Table.Td><Badge color={STATUS_COLORS[m.status] || 'gray'} variant="light" size="sm">{m.status}</Badge></Table.Td>
                                <Table.Td><Text size="sm" c="dimmed" lineClamp={1}>{m.notes || '—'}</Text></Table.Td>
                            </Table.Tr>
                        ))}
                        {filtered.length === 0 && <Table.Tr><Table.Td colSpan={5}><Text ta="center" c="dimmed" py="xl">No credit memos found</Text></Table.Td></Table.Tr>}
                    </Table.Tbody>
                </Table>
            </Paper>
        </div>
    );
}
