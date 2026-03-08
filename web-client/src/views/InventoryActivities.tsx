import { Title, Table, Paper, Group, Text, Badge, SimpleGrid, Card, ThemeIcon, TextInput, Tabs } from '@mantine/core';
import { IconBox, IconSearch, IconArrowsTransferDown, IconArrowsTransferUp } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useState } from 'react';

export function InventoryActivities() {
    const [search, setSearch] = useState('');
    const { data: products = [] } = useQuery({ queryKey: ['inv-products'], queryFn: async () => (await apiClient.get('/products')).data });

    const filtered = products.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase()));
    const totalValue = products.reduce((s: number, p: any) => s + Number(p.stock_quantity || 0) * Number(p.unit_price || 0), 0);
    const lowStock = products.filter((p: any) => Number(p.stock_quantity || 0) <= Number(p.reorder_point || 5) && Number(p.stock_quantity || 0) > 0).length;
    const outOfStock = products.filter((p: any) => Number(p.stock_quantity || 0) === 0).length;

    return (
        <div>
            <Title order={2} mb="md">Inventory Activities</Title>
            <SimpleGrid cols={4} mb="lg">
                <Card withBorder radius="md" p="md"><Group><ThemeIcon variant="light" color="blue" size="lg"><IconBox size={20} /></ThemeIcon><div><Text size="xs" tt="uppercase" c="dimmed" fw={700}>TOTAL ITEMS</Text><Text size="lg" fw={700}>{products.length}</Text></div></Group></Card>
                <Card withBorder radius="md" p="md"><Group><ThemeIcon variant="light" color="green" size="lg"><IconBox size={20} /></ThemeIcon><div><Text size="xs" tt="uppercase" c="dimmed" fw={700}>INVENTORY VALUE</Text><Text size="lg" fw={700}>${totalValue.toLocaleString()}</Text></div></Group></Card>
                <Card withBorder radius="md" p="md"><Group><ThemeIcon variant="light" color="yellow" size="lg"><IconArrowsTransferDown size={20} /></ThemeIcon><div><Text size="xs" tt="uppercase" c="dimmed" fw={700}>LOW STOCK</Text><Text size="lg" fw={700} c="yellow">{lowStock}</Text></div></Group></Card>
                <Card withBorder radius="md" p="md"><Group><ThemeIcon variant="light" color="red" size="lg"><IconArrowsTransferUp size={20} /></ThemeIcon><div><Text size="xs" tt="uppercase" c="dimmed" fw={700}>OUT OF STOCK</Text><Text size="lg" fw={700} c="red">{outOfStock}</Text></div></Group></Card>
            </SimpleGrid>
            <Tabs defaultValue="stock">
                <Tabs.List mb="md">
                    <Tabs.Tab value="stock">Stock Status</Tabs.Tab>
                    <Tabs.Tab value="valuation">Inventory Valuation</Tabs.Tab>
                </Tabs.List>
                <Tabs.Panel value="stock">
                    <TextInput placeholder="Search products..." leftSection={<IconSearch size={16} />} value={search} onChange={e => setSearch(e.currentTarget.value)} mb="md" />
                    <Paper withBorder radius="md">
                        <Table striped highlightOnHover>
                            <Table.Thead><Table.Tr><Table.Th>SKU</Table.Th><Table.Th>Product</Table.Th><Table.Th style={{ textAlign: 'right' }}>On Hand</Table.Th><Table.Th style={{ textAlign: 'right' }}>Reorder Pt</Table.Th><Table.Th style={{ textAlign: 'right' }}>Unit Price</Table.Th><Table.Th>Status</Table.Th></Table.Tr></Table.Thead>
                            <Table.Tbody>
                                {filtered.map((p: any) => {
                                    const qty = Number(p.stock_quantity || 0);
                                    const rp = Number(p.reorder_point || 5);
                                    const status = qty === 0 ? 'OUT' : qty <= rp ? 'LOW' : 'OK';
                                    return (
                                        <Table.Tr key={p.id}>
                                            <Table.Td><Text size="sm" c="dimmed">{p.sku || '—'}</Text></Table.Td>
                                            <Table.Td fw={500}>{p.name}</Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }} fw={600} c={status === 'OUT' ? 'red' : status === 'LOW' ? 'yellow' : undefined}>{qty}</Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>{rp}</Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>${Number(p.unit_price || 0).toLocaleString()}</Table.Td>
                                            <Table.Td><Badge color={status === 'OK' ? 'green' : status === 'LOW' ? 'yellow' : 'red'} variant="light" size="sm">{status === 'OUT' ? 'OUT OF STOCK' : status === 'LOW' ? 'LOW STOCK' : 'IN STOCK'}</Badge></Table.Td>
                                        </Table.Tr>
                                    );
                                })}
                                {filtered.length === 0 && <Table.Tr><Table.Td colSpan={6}><Text ta="center" c="dimmed" py="xl">No products found</Text></Table.Td></Table.Tr>}
                            </Table.Tbody>
                        </Table>
                    </Paper>
                </Tabs.Panel>
                <Tabs.Panel value="valuation">
                    <Paper withBorder radius="md">
                        <Table striped highlightOnHover>
                            <Table.Thead><Table.Tr><Table.Th>Product</Table.Th><Table.Th style={{ textAlign: 'right' }}>Qty</Table.Th><Table.Th style={{ textAlign: 'right' }}>Unit Cost</Table.Th><Table.Th style={{ textAlign: 'right' }}>Total Value</Table.Th><Table.Th style={{ textAlign: 'right' }}>% of Total</Table.Th></Table.Tr></Table.Thead>
                            <Table.Tbody>
                                {products.map((p: any) => {
                                    const val = Number(p.stock_quantity || 0) * Number(p.unit_price || 0);
                                    const pct = totalValue > 0 ? ((val / totalValue) * 100).toFixed(1) : '0.0';
                                    return (
                                        <Table.Tr key={p.id}>
                                            <Table.Td fw={500}>{p.name}</Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>{Number(p.stock_quantity || 0)}</Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>${Number(p.unit_price || 0).toLocaleString()}</Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }} fw={600}>${val.toLocaleString()}</Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}><Badge variant="light" size="sm">{pct}%</Badge></Table.Td>
                                        </Table.Tr>
                                    );
                                })}
                                <Table.Tr style={{ borderTop: '3px double var(--mantine-color-dark-4)', background: 'var(--mantine-color-dark-6)' }}>
                                    <Table.Td fw={700}>TOTAL</Table.Td><Table.Td colSpan={2}></Table.Td>
                                    <Table.Td style={{ textAlign: 'right' }} fw={700}>${totalValue.toLocaleString()}</Table.Td>
                                    <Table.Td style={{ textAlign: 'right' }} fw={700}>100%</Table.Td>
                                </Table.Tr>
                            </Table.Tbody>
                        </Table>
                    </Paper>
                </Tabs.Panel>
            </Tabs>
        </div>
    );
}
