import { Title, Table, Paper, Group, Text, Badge, SimpleGrid, Card, ThemeIcon, TextInput, Button } from '@mantine/core';
import { IconFileText, IconPlus, IconSearch } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useState } from 'react';

const STATUS_COLORS: Record<string, string> = { OPEN: 'blue', PARTIALLY_PAID: 'yellow', PAID: 'green', OVERDUE: 'red' };

export function Bills() {
    const [search, setSearch] = useState('');
    const { data: bills = [] } = useQuery({ queryKey: ['bills'], queryFn: async () => (await apiClient.get('/bills')).data });

    const filtered = bills.filter((b: any) => b.bill_number.toLowerCase().includes(search.toLowerCase()));
    const totalOwed = bills.reduce((s: number, b: any) => s + Number(b.total_amount) - Number(b.amount_paid), 0);
    const overdue = bills.filter((b: any) => b.status === 'OVERDUE').length;

    return (
        <div>
            <Group justify="space-between" mb="md">
                <Title order={2}>Bills (Accounts Payable)</Title>
                <Button leftSection={<IconPlus size={16} />} disabled>Enter Bill</Button>
            </Group>
            <SimpleGrid cols={3} mb="lg">
                {[
                    { label: 'TOTAL BILLS', value: bills.length, color: 'blue' },
                    { label: 'TOTAL OWED', value: `$${totalOwed.toLocaleString()}`, color: 'red' },
                    { label: 'OVERDUE', value: overdue, color: 'orange' },
                ].map(s => (
                    <Card key={s.label} withBorder radius="md" p="md"><Group><ThemeIcon variant="light" color={s.color} size="lg"><IconFileText size={20} /></ThemeIcon><div><Text size="xs" tt="uppercase" c="dimmed" fw={700}>{s.label}</Text><Text size="lg" fw={700}>{s.value}</Text></div></Group></Card>
                ))}
            </SimpleGrid>
            <TextInput placeholder="Search bills..." leftSection={<IconSearch size={16} />} value={search} onChange={e => setSearch(e.currentTarget.value)} mb="md" />
            <Paper withBorder radius="md">
                <Table striped highlightOnHover>
                    <Table.Thead><Table.Tr><Table.Th>Bill #</Table.Th><Table.Th>Date</Table.Th><Table.Th>Due Date</Table.Th><Table.Th>Total</Table.Th><Table.Th>Paid</Table.Th><Table.Th>Balance</Table.Th><Table.Th>Status</Table.Th></Table.Tr></Table.Thead>
                    <Table.Tbody>
                        {filtered.map((b: any) => (
                            <Table.Tr key={b.id}>
                                <Table.Td><Text fw={500}>{b.bill_number}</Text></Table.Td>
                                <Table.Td>{new Date(b.date).toLocaleDateString()}</Table.Td>
                                <Table.Td>{new Date(b.due_date).toLocaleDateString()}</Table.Td>
                                <Table.Td>${Number(b.total_amount).toLocaleString()}</Table.Td>
                                <Table.Td>${Number(b.amount_paid).toLocaleString()}</Table.Td>
                                <Table.Td fw={600} c={Number(b.total_amount) - Number(b.amount_paid) > 0 ? 'red' : 'green'}>${(Number(b.total_amount) - Number(b.amount_paid)).toLocaleString()}</Table.Td>
                                <Table.Td><Badge color={STATUS_COLORS[b.status] || 'gray'} variant="light" size="sm">{b.status}</Badge></Table.Td>
                            </Table.Tr>
                        ))}
                        {filtered.length === 0 && <Table.Tr><Table.Td colSpan={7}><Text ta="center" c="dimmed" py="xl">No bills found</Text></Table.Td></Table.Tr>}
                    </Table.Tbody>
                </Table>
            </Paper>
        </div>
    );
}
