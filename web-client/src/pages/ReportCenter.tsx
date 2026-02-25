import { Title, Paper, Group, Text, Badge, SimpleGrid, Card, ThemeIcon, Table, Tabs, Loader, Center } from '@mantine/core';
import { IconChartBar, IconReportAnalytics, IconCoin, IconScale, IconUsers, IconBuildingStore } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

function fmt(v: any): string { return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` }

export function ReportCenter() {
    const { data: pnl, isLoading: loadPnl } = useQuery({ queryKey: ['report-pnl'], queryFn: async () => (await apiClient.get('/reports/profit-loss')).data });
    const { data: bs, isLoading: loadBs } = useQuery({ queryKey: ['report-bs'], queryFn: async () => (await apiClient.get('/reports/balance-sheet')).data });
    const { data: tb, isLoading: loadTb } = useQuery({ queryKey: ['report-tb'], queryFn: async () => (await apiClient.get('/reports/trial-balance')).data });
    const { data: ar, isLoading: loadAr } = useQuery({ queryKey: ['report-ar'], queryFn: async () => (await apiClient.get('/reports/ar-aging')).data });
    const { data: ap, isLoading: loadAp } = useQuery({ queryKey: ['report-ap'], queryFn: async () => (await apiClient.get('/reports/ap-aging')).data });
    const { data: sales, isLoading: loadSales } = useQuery({ queryKey: ['report-sales'], queryFn: async () => (await apiClient.get('/reports/sales-summary')).data });

    return (
        <div>
            <Title order={2} mb="lg">Report Center</Title>

            {/* Summary Cards */}
            <SimpleGrid cols={4} mb="xl">
                <Card withBorder radius="md" p="md">
                    <Group><ThemeIcon variant="light" color="green" size="lg"><IconCoin size={20} /></ThemeIcon>
                        <div><Text size="xs" tt="uppercase" c="dimmed" fw={700}>NET INCOME</Text>
                            <Text size="lg" fw={700} c={pnl && Number(pnl.net_income) >= 0 ? 'green' : 'red'}>{loadPnl ? '...' : fmt(pnl?.net_income)}</Text></div></Group>
                </Card>
                <Card withBorder radius="md" p="md">
                    <Group><ThemeIcon variant="light" color="blue" size="lg"><IconScale size={20} /></ThemeIcon>
                        <div><Text size="xs" tt="uppercase" c="dimmed" fw={700}>TOTAL ASSETS</Text>
                            <Text size="lg" fw={700}>{loadBs ? '...' : fmt(bs?.total_assets)}</Text></div></Group>
                </Card>
                <Card withBorder radius="md" p="md">
                    <Group><ThemeIcon variant="light" color="red" size="lg"><IconUsers size={20} /></ThemeIcon>
                        <div><Text size="xs" tt="uppercase" c="dimmed" fw={700}>A/R OUTSTANDING</Text>
                            <Text size="lg" fw={700}>{loadAr ? '...' : fmt(ar?.grand_total)}</Text></div></Group>
                </Card>
                <Card withBorder radius="md" p="md">
                    <Group><ThemeIcon variant="light" color="orange" size="lg"><IconBuildingStore size={20} /></ThemeIcon>
                        <div><Text size="xs" tt="uppercase" c="dimmed" fw={700}>A/P OUTSTANDING</Text>
                            <Text size="lg" fw={700}>{loadAp ? '...' : fmt(ap?.grand_total)}</Text></div></Group>
                </Card>
            </SimpleGrid>

            <Tabs defaultValue="pnl">
                <Tabs.List mb="md">
                    <Tabs.Tab value="pnl" leftSection={<IconChartBar size={16} />}>Profit & Loss</Tabs.Tab>
                    <Tabs.Tab value="bs" leftSection={<IconScale size={16} />}>Balance Sheet</Tabs.Tab>
                    <Tabs.Tab value="tb" leftSection={<IconReportAnalytics size={16} />}>Trial Balance</Tabs.Tab>
                    <Tabs.Tab value="ar" leftSection={<IconUsers size={16} />}>A/R Aging</Tabs.Tab>
                    <Tabs.Tab value="ap" leftSection={<IconBuildingStore size={16} />}>A/P Aging</Tabs.Tab>
                    <Tabs.Tab value="sales" leftSection={<IconCoin size={16} />}>Sales Summary</Tabs.Tab>
                </Tabs.List>

                {/* Profit & Loss */}
                <Tabs.Panel value="pnl">
                    {loadPnl ? <Center h={200}><Loader /></Center> : pnl && (
                        <Paper withBorder radius="md" p="md">
                            <Title order={4} mb="md">Profit & Loss Statement</Title>
                            <Table striped>
                                <Table.Thead><Table.Tr><Table.Th>Account</Table.Th><Table.Th style={{ textAlign: 'right' }}>Amount</Table.Th></Table.Tr></Table.Thead>
                                <Table.Tbody>
                                    <Table.Tr><Table.Td colSpan={2}><Text fw={700} c="green">INCOME</Text></Table.Td></Table.Tr>
                                    {pnl.income.map((l: any) => <Table.Tr key={l.account_number}><Table.Td pl="xl">{l.account_number} — {l.name}</Table.Td><Table.Td style={{ textAlign: 'right' }}>{fmt(l.amount)}</Table.Td></Table.Tr>)}
                                    <Table.Tr style={{ borderTop: '2px solid var(--mantine-color-dark-4)' }}><Table.Td fw={600}>Total Income</Table.Td><Table.Td style={{ textAlign: 'right' }} fw={700}>{fmt(pnl.total_income)}</Table.Td></Table.Tr>

                                    <Table.Tr><Table.Td colSpan={2}><Text fw={700} c="orange" mt="sm">COST OF GOODS SOLD</Text></Table.Td></Table.Tr>
                                    {pnl.cogs.map((l: any) => <Table.Tr key={l.account_number}><Table.Td pl="xl">{l.account_number} — {l.name}</Table.Td><Table.Td style={{ textAlign: 'right' }}>{fmt(l.amount)}</Table.Td></Table.Tr>)}
                                    <Table.Tr style={{ borderTop: '2px solid var(--mantine-color-dark-4)' }}><Table.Td fw={600}>Gross Profit</Table.Td><Table.Td style={{ textAlign: 'right' }} fw={700} c="green">{fmt(pnl.gross_profit)}</Table.Td></Table.Tr>

                                    <Table.Tr><Table.Td colSpan={2}><Text fw={700} c="red" mt="sm">EXPENSES</Text></Table.Td></Table.Tr>
                                    {pnl.expenses.map((l: any) => <Table.Tr key={l.account_number}><Table.Td pl="xl">{l.account_number} — {l.name}</Table.Td><Table.Td style={{ textAlign: 'right' }}>{fmt(l.amount)}</Table.Td></Table.Tr>)}
                                    <Table.Tr style={{ borderTop: '2px solid var(--mantine-color-dark-4)' }}><Table.Td fw={600}>Total Expenses</Table.Td><Table.Td style={{ textAlign: 'right' }} fw={700}>{fmt(pnl.total_expenses)}</Table.Td></Table.Tr>

                                    <Table.Tr style={{ borderTop: '3px double var(--mantine-color-dark-4)', background: 'var(--mantine-color-dark-6)' }}><Table.Td fw={700} fz="lg">NET INCOME</Table.Td><Table.Td style={{ textAlign: 'right' }} fw={700} fz="lg" c={Number(pnl.net_income) >= 0 ? 'green' : 'red'}>{fmt(pnl.net_income)}</Table.Td></Table.Tr>
                                </Table.Tbody>
                            </Table>
                        </Paper>
                    )}
                </Tabs.Panel>

                {/* Balance Sheet */}
                <Tabs.Panel value="bs">
                    {loadBs ? <Center h={200}><Loader /></Center> : bs && (
                        <Paper withBorder radius="md" p="md">
                            <Title order={4} mb="md">Balance Sheet</Title>
                            <SimpleGrid cols={2}>
                                <div>
                                    <Text fw={700} c="blue" mb="xs">ASSETS</Text>
                                    <Table striped>
                                        <Table.Tbody>
                                            {bs.assets.map((l: any) => <Table.Tr key={l.account_number}><Table.Td>{l.account_number} — {l.name}</Table.Td><Table.Td style={{ textAlign: 'right' }}>{fmt(l.amount)}</Table.Td></Table.Tr>)}
                                            <Table.Tr style={{ borderTop: '2px solid var(--mantine-color-dark-4)' }}><Table.Td fw={700}>Total Assets</Table.Td><Table.Td style={{ textAlign: 'right' }} fw={700}>{fmt(bs.total_assets)}</Table.Td></Table.Tr>
                                        </Table.Tbody>
                                    </Table>
                                </div>
                                <div>
                                    <Text fw={700} c="red" mb="xs">LIABILITIES</Text>
                                    <Table striped>
                                        <Table.Tbody>
                                            {bs.liabilities.map((l: any) => <Table.Tr key={l.account_number}><Table.Td>{l.account_number} — {l.name}</Table.Td><Table.Td style={{ textAlign: 'right' }}>{fmt(l.amount)}</Table.Td></Table.Tr>)}
                                            <Table.Tr style={{ borderTop: '2px solid var(--mantine-color-dark-4)' }}><Table.Td fw={700}>Total Liabilities</Table.Td><Table.Td style={{ textAlign: 'right' }} fw={700}>{fmt(bs.total_liabilities)}</Table.Td></Table.Tr>
                                        </Table.Tbody>
                                    </Table>
                                    <Text fw={700} c="violet" mb="xs" mt="md">EQUITY</Text>
                                    <Table striped>
                                        <Table.Tbody>
                                            {bs.equity.map((l: any) => <Table.Tr key={l.account_number}><Table.Td>{l.account_number} — {l.name}</Table.Td><Table.Td style={{ textAlign: 'right' }}>{fmt(l.amount)}</Table.Td></Table.Tr>)}
                                            <Table.Tr style={{ borderTop: '2px solid var(--mantine-color-dark-4)' }}><Table.Td fw={700}>Total Equity</Table.Td><Table.Td style={{ textAlign: 'right' }} fw={700}>{fmt(bs.total_equity)}</Table.Td></Table.Tr>
                                        </Table.Tbody>
                                    </Table>
                                </div>
                            </SimpleGrid>
                        </Paper>
                    )}
                </Tabs.Panel>

                {/* Trial Balance */}
                <Tabs.Panel value="tb">
                    {loadTb ? <Center h={200}><Loader /></Center> : tb && (
                        <Paper withBorder radius="md" p="md">
                            <Title order={4} mb="md">Trial Balance</Title>
                            <Table striped highlightOnHover>
                                <Table.Thead><Table.Tr><Table.Th>Acct #</Table.Th><Table.Th>Account</Table.Th><Table.Th>Type</Table.Th><Table.Th style={{ textAlign: 'right' }}>Debit</Table.Th><Table.Th style={{ textAlign: 'right' }}>Credit</Table.Th></Table.Tr></Table.Thead>
                                <Table.Tbody>
                                    {tb.lines.map((l: any) => (
                                        <Table.Tr key={l.account_number}>
                                            <Table.Td>{l.account_number}</Table.Td>
                                            <Table.Td>{l.account_name}</Table.Td>
                                            <Table.Td><Badge variant="light" size="sm">{l.account_type.replace(/_/g, ' ')}</Badge></Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>{Number(l.debit) > 0 ? fmt(l.debit) : ''}</Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>{Number(l.credit) > 0 ? fmt(l.credit) : ''}</Table.Td>
                                        </Table.Tr>
                                    ))}
                                    <Table.Tr style={{ borderTop: '3px double var(--mantine-color-dark-4)', background: 'var(--mantine-color-dark-6)' }}>
                                        <Table.Td colSpan={3} fw={700}>TOTALS</Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }} fw={700}>{fmt(tb.total_debits)}</Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }} fw={700}>{fmt(tb.total_credits)}</Table.Td>
                                    </Table.Tr>
                                </Table.Tbody>
                            </Table>
                        </Paper>
                    )}
                </Tabs.Panel>

                {/* A/R Aging */}
                <Tabs.Panel value="ar">
                    {loadAr ? <Center h={200}><Loader /></Center> : ar && (
                        <Paper withBorder radius="md" p="md">
                            <Title order={4} mb="md">Accounts Receivable Aging</Title>
                            <SimpleGrid cols={5} mb="lg">
                                {[
                                    { label: 'CURRENT', value: ar.total_current, color: 'green' },
                                    { label: '1-30 DAYS', value: ar.total_1_30, color: 'yellow' },
                                    { label: '31-60 DAYS', value: ar.total_31_60, color: 'orange' },
                                    { label: '61-90 DAYS', value: ar.total_61_90, color: 'red' },
                                    { label: '90+ DAYS', value: ar.total_over_90, color: 'red' },
                                ].map(b => (
                                    <Card key={b.label} withBorder radius="md" p="sm"><Text size="xs" c="dimmed" fw={700}>{b.label}</Text><Text fw={700} c={b.color}>{fmt(b.value)}</Text></Card>
                                ))}
                            </SimpleGrid>
                            <Table striped highlightOnHover>
                                <Table.Thead><Table.Tr><Table.Th>Customer</Table.Th><Table.Th style={{ textAlign: 'right' }}>Current</Table.Th><Table.Th style={{ textAlign: 'right' }}>1-30</Table.Th><Table.Th style={{ textAlign: 'right' }}>31-60</Table.Th><Table.Th style={{ textAlign: 'right' }}>61-90</Table.Th><Table.Th style={{ textAlign: 'right' }}>90+</Table.Th><Table.Th style={{ textAlign: 'right' }}>Total</Table.Th></Table.Tr></Table.Thead>
                                <Table.Tbody>
                                    {ar.lines.map((l: any) => (
                                        <Table.Tr key={l.name}>
                                            <Table.Td fw={500}>{l.name}</Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>{fmt(l.current)}</Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>{fmt(l.days_1_30)}</Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>{fmt(l.days_31_60)}</Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>{fmt(l.days_61_90)}</Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>{fmt(l.over_90)}</Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }} fw={700}>{fmt(l.total)}</Table.Td>
                                        </Table.Tr>
                                    ))}
                                    {ar.lines.length === 0 && <Table.Tr><Table.Td colSpan={7}><Text ta="center" c="dimmed" py="xl">No outstanding receivables</Text></Table.Td></Table.Tr>}
                                    <Table.Tr style={{ borderTop: '3px double var(--mantine-color-dark-4)', background: 'var(--mantine-color-dark-6)' }}>
                                        <Table.Td fw={700}>TOTAL</Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }} fw={700}>{fmt(ar.total_current)}</Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }} fw={700}>{fmt(ar.total_1_30)}</Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }} fw={700}>{fmt(ar.total_31_60)}</Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }} fw={700}>{fmt(ar.total_61_90)}</Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }} fw={700}>{fmt(ar.total_over_90)}</Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }} fw={700}>{fmt(ar.grand_total)}</Table.Td>
                                    </Table.Tr>
                                </Table.Tbody>
                            </Table>
                        </Paper>
                    )}
                </Tabs.Panel>

                {/* A/P Aging */}
                <Tabs.Panel value="ap">
                    {loadAp ? <Center h={200}><Loader /></Center> : ap && (
                        <Paper withBorder radius="md" p="md">
                            <Title order={4} mb="md">Accounts Payable Aging</Title>
                            <SimpleGrid cols={5} mb="lg">
                                {[
                                    { label: 'CURRENT', value: ap.total_current, color: 'green' },
                                    { label: '1-30 DAYS', value: ap.total_1_30, color: 'yellow' },
                                    { label: '31-60 DAYS', value: ap.total_31_60, color: 'orange' },
                                    { label: '61-90 DAYS', value: ap.total_61_90, color: 'red' },
                                    { label: '90+ DAYS', value: ap.total_over_90, color: 'red' },
                                ].map(b => (
                                    <Card key={b.label} withBorder radius="md" p="sm"><Text size="xs" c="dimmed" fw={700}>{b.label}</Text><Text fw={700} c={b.color}>{fmt(b.value)}</Text></Card>
                                ))}
                            </SimpleGrid>
                            <Table striped highlightOnHover>
                                <Table.Thead><Table.Tr><Table.Th>Vendor</Table.Th><Table.Th style={{ textAlign: 'right' }}>Current</Table.Th><Table.Th style={{ textAlign: 'right' }}>1-30</Table.Th><Table.Th style={{ textAlign: 'right' }}>31-60</Table.Th><Table.Th style={{ textAlign: 'right' }}>61-90</Table.Th><Table.Th style={{ textAlign: 'right' }}>90+</Table.Th><Table.Th style={{ textAlign: 'right' }}>Total</Table.Th></Table.Tr></Table.Thead>
                                <Table.Tbody>
                                    {ap.lines.map((l: any) => (
                                        <Table.Tr key={l.name}>
                                            <Table.Td fw={500}>{l.name}</Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>{fmt(l.current)}</Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>{fmt(l.days_1_30)}</Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>{fmt(l.days_31_60)}</Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>{fmt(l.days_61_90)}</Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>{fmt(l.over_90)}</Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }} fw={700}>{fmt(l.total)}</Table.Td>
                                        </Table.Tr>
                                    ))}
                                    {ap.lines.length === 0 && <Table.Tr><Table.Td colSpan={7}><Text ta="center" c="dimmed" py="xl">No outstanding payables</Text></Table.Td></Table.Tr>}
                                    <Table.Tr style={{ borderTop: '3px double var(--mantine-color-dark-4)', background: 'var(--mantine-color-dark-6)' }}>
                                        <Table.Td fw={700}>TOTAL</Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }} fw={700}>{fmt(ap.total_current)}</Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }} fw={700}>{fmt(ap.total_1_30)}</Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }} fw={700}>{fmt(ap.total_31_60)}</Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }} fw={700}>{fmt(ap.total_61_90)}</Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }} fw={700}>{fmt(ap.total_over_90)}</Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }} fw={700}>{fmt(ap.grand_total)}</Table.Td>
                                    </Table.Tr>
                                </Table.Tbody>
                            </Table>
                        </Paper>
                    )}
                </Tabs.Panel>

                {/* Sales Summary */}
                <Tabs.Panel value="sales">
                    {loadSales ? <Center h={200}><Loader /></Center> : sales && (
                        <Paper withBorder radius="md" p="md">
                            <Title order={4} mb="md">Sales Summary</Title>
                            <SimpleGrid cols={4} mb="lg">
                                <Card withBorder radius="md" p="md"><Text size="xs" c="dimmed" fw={700}>TOTAL INVOICED</Text><Text size="lg" fw={700}>{fmt(sales.total_invoiced)}</Text></Card>
                                <Card withBorder radius="md" p="md"><Text size="xs" c="dimmed" fw={700}>COLLECTED</Text><Text size="lg" fw={700} c="green">{fmt(sales.total_collected)}</Text></Card>
                                <Card withBorder radius="md" p="md"><Text size="xs" c="dimmed" fw={700}>OUTSTANDING</Text><Text size="lg" fw={700} c="red">{fmt(sales.outstanding)}</Text></Card>
                                <Card withBorder radius="md" p="md"><Text size="xs" c="dimmed" fw={700}>AVG INVOICE</Text><Text size="lg" fw={700}>{fmt(sales.avg_invoice)}</Text></Card>
                            </SimpleGrid>
                            <Title order={5} mb="sm">Monthly Revenue</Title>
                            <Table striped highlightOnHover>
                                <Table.Thead><Table.Tr><Table.Th>Month</Table.Th><Table.Th style={{ textAlign: 'right' }}>Revenue</Table.Th><Table.Th style={{ textAlign: 'right' }}>Invoices</Table.Th><Table.Th>Bar</Table.Th></Table.Tr></Table.Thead>
                                <Table.Tbody>
                                    {sales.monthly.map((m: any) => {
                                        const maxRev = Math.max(...sales.monthly.map((mm: any) => Number(mm.revenue)));
                                        const pct = maxRev > 0 ? (Number(m.revenue) / maxRev) * 100 : 0;
                                        return (
                                            <Table.Tr key={m.month}>
                                                <Table.Td fw={500}>{m.month}</Table.Td>
                                                <Table.Td style={{ textAlign: 'right' }}>{fmt(m.revenue)}</Table.Td>
                                                <Table.Td style={{ textAlign: 'right' }}>{m.count}</Table.Td>
                                                <Table.Td><div style={{ width: '100%', background: 'var(--mantine-color-dark-5)', borderRadius: 4, height: 20 }}><div style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--mantine-color-blue-7), var(--mantine-color-green-5))', borderRadius: 4, height: 20, minWidth: pct > 0 ? 4 : 0, transition: 'width 0.5s ease' }} /></div></Table.Td>
                                            </Table.Tr>
                                        );
                                    })}
                                    {sales.monthly.length === 0 && <Table.Tr><Table.Td colSpan={4}><Text ta="center" c="dimmed" py="xl">No invoices found</Text></Table.Td></Table.Tr>}
                                </Table.Tbody>
                            </Table>
                        </Paper>
                    )}
                </Tabs.Panel>
            </Tabs>
        </div>
    );
}
