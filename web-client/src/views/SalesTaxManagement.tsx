import { Title, Table, Paper, Group, Text, Badge, SimpleGrid, Card, ThemeIcon, TextInput, Tabs } from '@mantine/core';
import { IconReceipt, IconSearch } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useState } from 'react';

function fmt(v: any) { return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` }

// Sales Tax rates (configurable in a full implementation)
const TAX_RATES = [
    { name: 'Texas State Sales Tax', rate: 6.25, jurisdiction: 'State' },
    { name: 'Local Sales Tax', rate: 2.00, jurisdiction: 'City/County' },
    { name: 'Combined Rate', rate: 8.25, jurisdiction: 'Combined' },
];

export function SalesTaxManagement() {
    const [search, setSearch] = useState('');
    const { data: invoices = [] } = useQuery({ queryKey: ['tax-invoices'], queryFn: async () => (await apiClient.get('/accounting/invoices')).data });
    const { data: salesReceipts = [] } = useQuery({ queryKey: ['tax-receipts'], queryFn: async () => { try { return (await apiClient.get('/sales-receipts')).data; } catch { return []; } } });

    // Calculate sales tax from invoices (assuming 8.25% combined rate)
    const taxRate = 0.0825;
    const taxableInvoices = invoices.filter((i: any) => Number(i.total_amount) > 0);
    const totalTaxableSales = taxableInvoices.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0);
    const estimatedTaxCollected = totalTaxableSales * taxRate;

    const receiptTotal = salesReceipts.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0);
    const receiptTax = receiptTotal * taxRate;

    const totalTaxOwed = estimatedTaxCollected + receiptTax;
    const totalSales = totalTaxableSales + receiptTotal;

    const filtered = taxableInvoices.filter((i: any) =>
        (i.invoice_number || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <Title order={2} mb="md">Sales Tax Center</Title>
            <SimpleGrid cols={4} mb="lg">
                <Card withBorder radius="md" p="md"><Group><ThemeIcon variant="light" color="blue" size="lg"><IconReceipt size={20} /></ThemeIcon><div><Text size="xs" tt="uppercase" c="dimmed" fw={700}>TOTAL SALES</Text><Text size="lg" fw={700}>{fmt(totalSales)}</Text></div></Group></Card>
                <Card withBorder radius="md" p="md"><Text size="xs" tt="uppercase" c="dimmed" fw={700}>TAX RATE</Text><Text size="lg" fw={700} c="blue">8.25%</Text></Card>
                <Card withBorder radius="md" p="md"><Text size="xs" tt="uppercase" c="dimmed" fw={700}>TAX COLLECTED</Text><Text size="lg" fw={700} c="green">{fmt(totalTaxOwed)}</Text></Card>
                <Card withBorder radius="md" p="md"><Text size="xs" tt="uppercase" c="dimmed" fw={700}>TAX OWED</Text><Text size="lg" fw={700} c="orange">{fmt(totalTaxOwed)}</Text></Card>
            </SimpleGrid>

            <Tabs defaultValue="liability">
                <Tabs.List mb="md">
                    <Tabs.Tab value="liability">Tax Liability</Tabs.Tab>
                    <Tabs.Tab value="rates">Tax Rates</Tabs.Tab>
                    <Tabs.Tab value="detail">Transaction Detail</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="liability">
                    <Paper withBorder radius="md" p="lg">
                        <Title order={4} mb="md">Sales Tax Liability Summary</Title>
                        <Table striped>
                            <Table.Thead><Table.Tr><Table.Th>Source</Table.Th><Table.Th style={{ textAlign: 'right' }}>Gross Sales</Table.Th><Table.Th style={{ textAlign: 'right' }}>Tax Rate</Table.Th><Table.Th style={{ textAlign: 'right' }}>Tax Amount</Table.Th></Table.Tr></Table.Thead>
                            <Table.Tbody>
                                <Table.Tr>
                                    <Table.Td fw={500}>Invoices ({taxableInvoices.length})</Table.Td>
                                    <Table.Td style={{ textAlign: 'right' }}>{fmt(totalTaxableSales)}</Table.Td>
                                    <Table.Td style={{ textAlign: 'right' }}>8.25%</Table.Td>
                                    <Table.Td style={{ textAlign: 'right' }} c="green">{fmt(estimatedTaxCollected)}</Table.Td>
                                </Table.Tr>
                                <Table.Tr>
                                    <Table.Td fw={500}>Sales Receipts ({salesReceipts.length})</Table.Td>
                                    <Table.Td style={{ textAlign: 'right' }}>{fmt(receiptTotal)}</Table.Td>
                                    <Table.Td style={{ textAlign: 'right' }}>8.25%</Table.Td>
                                    <Table.Td style={{ textAlign: 'right' }} c="green">{fmt(receiptTax)}</Table.Td>
                                </Table.Tr>
                                <Table.Tr style={{ borderTop: '3px double var(--mantine-color-dark-4)', background: 'var(--mantine-color-dark-6)' }}>
                                    <Table.Td fw={700}>TOTAL TAX OWED</Table.Td>
                                    <Table.Td style={{ textAlign: 'right' }} fw={700}>{fmt(totalSales)}</Table.Td>
                                    <Table.Td></Table.Td>
                                    <Table.Td style={{ textAlign: 'right' }} fw={700} c="orange">{fmt(totalTaxOwed)}</Table.Td>
                                </Table.Tr>
                            </Table.Tbody>
                        </Table>
                    </Paper>
                </Tabs.Panel>

                <Tabs.Panel value="rates">
                    <Paper withBorder radius="md" p="lg">
                        <Title order={4} mb="md">Configured Tax Rates</Title>
                        <Table striped>
                            <Table.Thead><Table.Tr><Table.Th>Tax Name</Table.Th><Table.Th>Jurisdiction</Table.Th><Table.Th style={{ textAlign: 'right' }}>Rate</Table.Th><Table.Th>Status</Table.Th></Table.Tr></Table.Thead>
                            <Table.Tbody>
                                {TAX_RATES.map((t) => (
                                    <Table.Tr key={t.name}>
                                        <Table.Td fw={500}>{t.name}</Table.Td>
                                        <Table.Td>{t.jurisdiction}</Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }} fw={600}>{t.rate.toFixed(2)}%</Table.Td>
                                        <Table.Td><Badge color="green" variant="light" size="sm">ACTIVE</Badge></Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Paper>
                </Tabs.Panel>

                <Tabs.Panel value="detail">
                    <TextInput placeholder="Search invoices..." leftSection={<IconSearch size={16} />} value={search} onChange={e => setSearch(e.currentTarget.value)} mb="md" />
                    <Paper withBorder radius="md">
                        <Table striped highlightOnHover>
                            <Table.Thead><Table.Tr><Table.Th>Invoice</Table.Th><Table.Th>Date</Table.Th><Table.Th style={{ textAlign: 'right' }}>Gross Amount</Table.Th><Table.Th style={{ textAlign: 'right' }}>Est. Tax</Table.Th><Table.Th>Status</Table.Th></Table.Tr></Table.Thead>
                            <Table.Tbody>
                                {filtered.map((i: any) => (
                                    <Table.Tr key={i.id}>
                                        <Table.Td fw={500}>{i.invoice_number}</Table.Td>
                                        <Table.Td>{i.date?.slice(0, 10)}</Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }}>{fmt(i.total_amount)}</Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }} c="green">{fmt(Number(i.total_amount) * taxRate)}</Table.Td>
                                        <Table.Td><Badge color={i.status === 'PAID' ? 'green' : i.status === 'OVERDUE' ? 'red' : 'blue'} variant="light" size="sm">{i.status}</Badge></Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Paper>
                </Tabs.Panel>
            </Tabs>
        </div>
    );
}
