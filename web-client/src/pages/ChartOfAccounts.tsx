import { Title, Table, Paper, Group, Text, Badge, SimpleGrid, Card, ThemeIcon, TextInput, Select, Button, Modal, Stack } from '@mantine/core';
import { IconListDetails, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useState } from 'react';

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
    BANK: 'blue', ACCOUNTS_RECEIVABLE: 'cyan', OTHER_CURRENT_ASSET: 'teal', FIXED_ASSET: 'indigo', OTHER_ASSET: 'grape',
    ACCOUNTS_PAYABLE: 'orange', CREDIT_CARD: 'red', OTHER_CURRENT_LIABILITY: 'pink', LONG_TERM_LIABILITY: 'red',
    EQUITY: 'violet',
    INCOME: 'green', OTHER_INCOME: 'lime',
    COST_OF_GOODS_SOLD: 'yellow',
    EXPENSE: 'red', OTHER_EXPENSE: 'orange',
};

const ACCOUNT_CATEGORIES = [
    { label: 'All', value: 'ALL' },
    { label: 'Assets', value: 'ASSET' },
    { label: 'Liabilities', value: 'LIABILITY' },
    { label: 'Equity', value: 'EQUITY' },
    { label: 'Income', value: 'INCOME' },
    { label: 'Cost of Goods Sold', value: 'COGS' },
    { label: 'Expenses', value: 'EXPENSE' },
];

const ACCOUNT_TYPES = [
    'BANK', 'ACCOUNTS_RECEIVABLE', 'OTHER_CURRENT_ASSET', 'FIXED_ASSET', 'OTHER_ASSET',
    'ACCOUNTS_PAYABLE', 'CREDIT_CARD', 'OTHER_CURRENT_LIABILITY', 'LONG_TERM_LIABILITY',
    'EQUITY', 'INCOME', 'OTHER_INCOME', 'COST_OF_GOODS_SOLD', 'EXPENSE', 'OTHER_EXPENSE',
];

function categoryFilter(accountType: string, category: string) {
    if (category === 'ALL') return true;
    if (category === 'ASSET') return ['BANK', 'ACCOUNTS_RECEIVABLE', 'OTHER_CURRENT_ASSET', 'FIXED_ASSET', 'OTHER_ASSET'].includes(accountType);
    if (category === 'LIABILITY') return ['ACCOUNTS_PAYABLE', 'CREDIT_CARD', 'OTHER_CURRENT_LIABILITY', 'LONG_TERM_LIABILITY'].includes(accountType);
    if (category === 'EQUITY') return accountType === 'EQUITY';
    if (category === 'INCOME') return ['INCOME', 'OTHER_INCOME'].includes(accountType);
    if (category === 'COGS') return accountType === 'COST_OF_GOODS_SOLD';
    if (category === 'EXPENSE') return ['EXPENSE', 'OTHER_EXPENSE'].includes(accountType);
    return true;
}

export function ChartOfAccounts() {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('ALL');
    const [addOpen, setAddOpen] = useState(false);
    const [newAccount, setNewAccount] = useState({ name: '', account_number: '', account_type: 'EXPENSE', description: '' });
    const queryClient = useQueryClient();

    const { data: accounts = [] } = useQuery({
        queryKey: ['accounts'],
        queryFn: async () => { const res = await apiClient.get('/accounts'); return res.data; },
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => apiClient.post('/accounts', data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['accounts'] }); setAddOpen(false); setNewAccount({ name: '', account_number: '', account_type: 'EXPENSE', description: '' }); },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiClient.delete(`/accounts/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
    });

    const filtered = accounts.filter((a: any) =>
        categoryFilter(a.account_type, category) &&
        (a.name.toLowerCase().includes(search.toLowerCase()) || (a.account_number || '').includes(search))
    );

    const totalsByType: Record<string, number> = {};
    accounts.forEach((a: any) => {
        const cat = ['BANK', 'ACCOUNTS_RECEIVABLE', 'OTHER_CURRENT_ASSET', 'FIXED_ASSET', 'OTHER_ASSET'].includes(a.account_type) ? 'Assets' :
            ['ACCOUNTS_PAYABLE', 'CREDIT_CARD', 'OTHER_CURRENT_LIABILITY', 'LONG_TERM_LIABILITY'].includes(a.account_type) ? 'Liabilities' :
                a.account_type === 'EQUITY' ? 'Equity' :
                    ['INCOME', 'OTHER_INCOME'].includes(a.account_type) ? 'Income' :
                        a.account_type === 'COST_OF_GOODS_SOLD' ? 'COGS' : 'Expenses';
        totalsByType[cat] = (totalsByType[cat] || 0) + Number(a.balance);
    });

    return (
        <div>
            <Group justify="space-between" mb="md">
                <Title order={2}>Chart of Accounts</Title>
                <Button leftSection={<IconPlus size={16} />} onClick={() => setAddOpen(true)}>New Account</Button>
            </Group>

            <SimpleGrid cols={4} mb="lg">
                {[
                    { label: 'TOTAL ASSETS', value: totalsByType['Assets'] || 0, color: 'blue' },
                    { label: 'TOTAL LIABILITIES', value: totalsByType['Liabilities'] || 0, color: 'orange' },
                    { label: 'TOTAL EQUITY', value: totalsByType['Equity'] || 0, color: 'violet' },
                    { label: 'NET INCOME', value: (totalsByType['Income'] || 0) - (totalsByType['COGS'] || 0) - (totalsByType['Expenses'] || 0), color: 'green' },
                ].map((s) => (
                    <Card key={s.label} withBorder radius="md" p="md">
                        <Group>
                            <ThemeIcon variant="light" color={s.color} size="lg"><IconListDetails size={20} /></ThemeIcon>
                            <div>
                                <Text size="xs" tt="uppercase" c="dimmed" fw={700}>{s.label}</Text>
                                <Text size="lg" fw={700}>${s.value.toLocaleString()}</Text>
                            </div>
                        </Group>
                    </Card>
                ))}
            </SimpleGrid>

            <Group mb="md" gap="sm">
                <TextInput placeholder="Search accounts..." leftSection={<IconSearch size={16} />} value={search} onChange={(e) => setSearch(e.currentTarget.value)} style={{ flex: 1 }} />
                <Select data={ACCOUNT_CATEGORIES} value={category} onChange={(v) => setCategory(v || 'ALL')} w={180} />
            </Group>

            <Paper withBorder radius="md">
                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Account #</Table.Th>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>Type</Table.Th>
                            <Table.Th>Balance</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th w={60}></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filtered.map((a: any) => (
                            <Table.Tr key={a.id}>
                                <Table.Td><Text fw={500}>{a.account_number || '—'}</Text></Table.Td>
                                <Table.Td>{a.name}</Table.Td>
                                <Table.Td><Badge color={ACCOUNT_TYPE_COLORS[a.account_type] || 'gray'} variant="light" size="sm">{a.account_type.replace(/_/g, ' ')}</Badge></Table.Td>
                                <Table.Td>${Number(a.balance).toLocaleString()}</Table.Td>
                                <Table.Td>{a.is_active ? <Badge color="green" variant="light" size="sm">Active</Badge> : <Badge color="gray" variant="light" size="sm">Inactive</Badge>}</Table.Td>
                                <Table.Td>{!a.is_system && <IconTrash size={16} style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => deleteMutation.mutate(a.id)} />}</Table.Td>
                            </Table.Tr>
                        ))}
                        {filtered.length === 0 && <Table.Tr><Table.Td colSpan={6}><Text ta="center" c="dimmed" py="xl">No accounts found</Text></Table.Td></Table.Tr>}
                    </Table.Tbody>
                </Table>
            </Paper>

            <Modal opened={addOpen} onClose={() => setAddOpen(false)} title="New Account" centered>
                <Stack>
                    <TextInput label="Account Number" placeholder="e.g. 6100" value={newAccount.account_number} onChange={(e) => setNewAccount({ ...newAccount, account_number: e.currentTarget.value })} />
                    <TextInput label="Account Name" placeholder="e.g. Office Supplies" required value={newAccount.name} onChange={(e) => setNewAccount({ ...newAccount, name: e.currentTarget.value })} />
                    <Select label="Account Type" data={ACCOUNT_TYPES.map(t => ({ label: t.replace(/_/g, ' '), value: t }))} value={newAccount.account_type} onChange={(v) => setNewAccount({ ...newAccount, account_type: v || 'EXPENSE' })} />
                    <TextInput label="Description" placeholder="Optional description" value={newAccount.description} onChange={(e) => setNewAccount({ ...newAccount, description: e.currentTarget.value })} />
                    <Button onClick={() => createMutation.mutate(newAccount)} loading={createMutation.isPending}>Create Account</Button>
                </Stack>
            </Modal>
        </div>
    );
}
