import { Title, Table, Paper, Group, Text, Badge, SimpleGrid, Card, ThemeIcon, TextInput } from '@mantine/core';
import { IconFileText, IconSearch } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useState } from 'react';

export function Checks() {
    const [search, setSearch] = useState('');
    const { data: checks = [] } = useQuery({ queryKey: ['checks'], queryFn: async () => (await apiClient.get('/checks')).data });

    const filtered = checks.filter((c: any) => c.payee_name.toLowerCase().includes(search.toLowerCase()) || (c.check_number || '').includes(search));
    const total = checks.reduce((s: number, c: any) => s + Number(c.total_amount), 0);

    return (
        <div>
            <Group justify="space-between" mb="md"><Title order={2}>Write Checks / Expenses</Title></Group>
            <SimpleGrid cols={2} mb="lg">
                <Card withBorder radius="md" p="md"><Group><ThemeIcon variant="light" color="blue" size="lg"><IconFileText size={20} /></ThemeIcon><div><Text size="xs" tt="uppercase" c="dimmed" fw={700}>TOTAL CHECKS</Text><Text size="lg" fw={700}>{checks.length}</Text></div></Group></Card>
                <Card withBorder radius="md" p="md"><Group><ThemeIcon variant="light" color="red" size="lg"><IconFileText size={20} /></ThemeIcon><div><Text size="xs" tt="uppercase" c="dimmed" fw={700}>TOTAL SPENT</Text><Text size="lg" fw={700}>${total.toLocaleString()}</Text></div></Group></Card>
            </SimpleGrid>
            <TextInput placeholder="Search checks..." leftSection={<IconSearch size={16} />} value={search} onChange={e => setSearch(e.currentTarget.value)} mb="md" />
            <Paper withBorder radius="md">
                <Table striped highlightOnHover>
                    <Table.Thead><Table.Tr><Table.Th>Check #</Table.Th><Table.Th>Date</Table.Th><Table.Th>Payee</Table.Th><Table.Th>Amount</Table.Th><Table.Th>Memo</Table.Th><Table.Th>Printed</Table.Th></Table.Tr></Table.Thead>
                    <Table.Tbody>
                        {filtered.map((c: any) => (
                            <Table.Tr key={c.id}>
                                <Table.Td><Text fw={500}>{c.check_number || '—'}</Text></Table.Td>
                                <Table.Td>{new Date(c.date).toLocaleDateString()}</Table.Td>
                                <Table.Td>{c.payee_name}</Table.Td>
                                <Table.Td>${Number(c.total_amount).toLocaleString()}</Table.Td>
                                <Table.Td><Text size="sm" c="dimmed" lineClamp={1}>{c.memo || '—'}</Text></Table.Td>
                                <Table.Td>{c.is_printed ? <Badge color="green" variant="light" size="sm">Yes</Badge> : <Badge color="gray" variant="light" size="sm">No</Badge>}</Table.Td>
                            </Table.Tr>
                        ))}
                        {filtered.length === 0 && <Table.Tr><Table.Td colSpan={6}><Text ta="center" c="dimmed" py="xl">No checks found</Text></Table.Td></Table.Tr>}
                    </Table.Tbody>
                </Table>
            </Paper>
        </div>
    );
}
