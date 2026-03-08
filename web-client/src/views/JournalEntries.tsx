import { Title, Table, Paper, Group, Text, Badge, SimpleGrid, Card, ThemeIcon, TextInput, Button } from '@mantine/core';
import { IconCalculator, IconPlus, IconSearch } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useState } from 'react';

export function JournalEntries() {
    const [search, setSearch] = useState('');
    const { data: entries = [] } = useQuery({ queryKey: ['journal-entries'], queryFn: async () => (await apiClient.get('/journal-entries')).data });

    const filtered = entries.filter((e: any) => e.entry_number.toLowerCase().includes(search.toLowerCase()) || (e.memo || '').toLowerCase().includes(search.toLowerCase()));
    const adjusting = entries.filter((e: any) => e.is_adjusting).length;

    return (
        <div>
            <Group justify="space-between" mb="md">
                <Title order={2}>Journal Entries</Title>
                <Button leftSection={<IconPlus size={16} />} disabled>New Journal Entry</Button>
            </Group>
            <SimpleGrid cols={2} mb="lg">
                <Card withBorder radius="md" p="md"><Group><ThemeIcon variant="light" color="blue" size="lg"><IconCalculator size={20} /></ThemeIcon><div><Text size="xs" tt="uppercase" c="dimmed" fw={700}>TOTAL ENTRIES</Text><Text size="lg" fw={700}>{entries.length}</Text></div></Group></Card>
                <Card withBorder radius="md" p="md"><Group><ThemeIcon variant="light" color="violet" size="lg"><IconCalculator size={20} /></ThemeIcon><div><Text size="xs" tt="uppercase" c="dimmed" fw={700}>ADJUSTING</Text><Text size="lg" fw={700}>{adjusting}</Text></div></Group></Card>
            </SimpleGrid>
            <TextInput placeholder="Search entries..." leftSection={<IconSearch size={16} />} value={search} onChange={e => setSearch(e.currentTarget.value)} mb="md" />
            <Paper withBorder radius="md">
                <Table striped highlightOnHover>
                    <Table.Thead><Table.Tr><Table.Th>Entry #</Table.Th><Table.Th>Date</Table.Th><Table.Th>Memo</Table.Th><Table.Th>Type</Table.Th></Table.Tr></Table.Thead>
                    <Table.Tbody>
                        {filtered.map((e: any) => (
                            <Table.Tr key={e.id}>
                                <Table.Td><Text fw={500}>{e.entry_number}</Text></Table.Td>
                                <Table.Td>{new Date(e.date).toLocaleDateString()}</Table.Td>
                                <Table.Td><Text size="sm" lineClamp={1}>{e.memo || '—'}</Text></Table.Td>
                                <Table.Td>{e.is_adjusting ? <Badge color="violet" variant="light" size="sm">Adjusting</Badge> : <Badge color="gray" variant="light" size="sm">Regular</Badge>}</Table.Td>
                            </Table.Tr>
                        ))}
                        {filtered.length === 0 && <Table.Tr><Table.Td colSpan={4}><Text ta="center" c="dimmed" py="xl">No journal entries found</Text></Table.Td></Table.Tr>}
                    </Table.Tbody>
                </Table>
            </Paper>
        </div>
    );
}
