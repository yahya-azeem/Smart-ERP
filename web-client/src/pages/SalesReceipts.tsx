import { Title, Table, Paper, Group, Text, Badge, SimpleGrid, Card, ThemeIcon, TextInput } from '@mantine/core';
import { IconReceipt, IconSearch } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useState } from 'react';

export function SalesReceipts() {
    const [search, setSearch] = useState('');
    const { data: receipts = [] } = useQuery({ queryKey: ['sales-receipts'], queryFn: async () => (await apiClient.get('/sales-receipts')).data });

    const filtered = receipts.filter((r: any) => r.receipt_number.toLowerCase().includes(search.toLowerCase()));
    const total = receipts.reduce((s: number, r: any) => s + Number(r.total_amount), 0);

    return (
        <div>
            <Group justify="space-between" mb="md">
                <Title order={2}>Sales Receipts</Title>
            </Group>
            <SimpleGrid cols={2} mb="lg">
                <Card withBorder radius="md" p="md"><Group><ThemeIcon variant="light" color="blue" size="lg"><IconReceipt size={20} /></ThemeIcon><div><Text size="xs" tt="uppercase" c="dimmed" fw={700}>RECEIPTS</Text><Text size="lg" fw={700}>{receipts.length}</Text></div></Group></Card>
                <Card withBorder radius="md" p="md"><Group><ThemeIcon variant="light" color="green" size="lg"><IconReceipt size={20} /></ThemeIcon><div><Text size="xs" tt="uppercase" c="dimmed" fw={700}>TOTAL REVENUE</Text><Text size="lg" fw={700}>${total.toLocaleString()}</Text></div></Group></Card>
            </SimpleGrid>
            <TextInput placeholder="Search..." leftSection={<IconSearch size={16} />} value={search} onChange={e => setSearch(e.currentTarget.value)} mb="md" />
            <Paper withBorder radius="md">
                <Table striped highlightOnHover>
                    <Table.Thead><Table.Tr><Table.Th>Receipt #</Table.Th><Table.Th>Date</Table.Th><Table.Th>Amount</Table.Th><Table.Th>Payment</Table.Th><Table.Th>Notes</Table.Th></Table.Tr></Table.Thead>
                    <Table.Tbody>
                        {filtered.map((r: any) => (
                            <Table.Tr key={r.id}>
                                <Table.Td><Text fw={500}>{r.receipt_number}</Text></Table.Td>
                                <Table.Td>{new Date(r.date).toLocaleDateString()}</Table.Td>
                                <Table.Td>${Number(r.total_amount).toLocaleString()}</Table.Td>
                                <Table.Td><Badge variant="light" size="sm">{r.payment_method}</Badge></Table.Td>
                                <Table.Td><Text size="sm" c="dimmed" lineClamp={1}>{r.notes || '—'}</Text></Table.Td>
                            </Table.Tr>
                        ))}
                        {filtered.length === 0 && <Table.Tr><Table.Td colSpan={5}><Text ta="center" c="dimmed" py="xl">No sales receipts found</Text></Table.Td></Table.Tr>}
                    </Table.Tbody>
                </Table>
            </Paper>
        </div>
    );
}
