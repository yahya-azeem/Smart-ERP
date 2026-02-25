import { Title, Table, Paper, Group, Text, Badge, SimpleGrid, Card, ThemeIcon, Select } from '@mantine/core';
import { IconBuildingBank, IconCheck, IconX, IconArrowsTransferDown } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useState } from 'react';

function fmt(v: any) { return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` }

export function BankReconciliation() {
    const { data: accounts = [] } = useQuery({ queryKey: ['recon-accounts'], queryFn: async () => (await apiClient.get('/accounts')).data });
    const { data: checks = [] } = useQuery({ queryKey: ['recon-checks'], queryFn: async () => (await apiClient.get('/checks')).data });
    const { data: invoices = [] } = useQuery({ queryKey: ['recon-invoices'], queryFn: async () => (await apiClient.get('/accounting/invoices')).data });

    const bankAccounts = accounts.filter((a: any) => a.account_type === 'BANK');
    const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

    const acct = bankAccounts.find((a: any) => a.id === selectedAccount);
    const accountBalance = Number(acct?.balance || 0);

    // Combine checks and payments as transactions for a mock reconciliation
    const paidInvoices = invoices.filter((i: any) => i.status === 'PAID');
    const totalDeposits = paidInvoices.reduce((s: number, i: any) => s + Number(i.amount_paid || 0), 0);
    const totalWithdrawals = checks.reduce((s: number, c: any) => s + Number(c.amount || 0), 0);
    const clearedBalance = accountBalance + totalDeposits - totalWithdrawals;

    return (
        <div>
            <Title order={2} mb="md">Bank Reconciliation</Title>
            <SimpleGrid cols={4} mb="lg">
                <Card withBorder radius="md" p="md"><Group><ThemeIcon variant="light" color="blue" size="lg"><IconBuildingBank size={20} /></ThemeIcon><div><Text size="xs" tt="uppercase" c="dimmed" fw={700}>BANK ACCOUNTS</Text><Text size="lg" fw={700}>{bankAccounts.length}</Text></div></Group></Card>
                <Card withBorder radius="md" p="md"><Group><ThemeIcon variant="light" color="green" size="lg"><IconArrowsTransferDown size={20} /></ThemeIcon><div><Text size="xs" tt="uppercase" c="dimmed" fw={700}>TOTAL DEPOSITS</Text><Text size="lg" fw={700} c="green">{fmt(totalDeposits)}</Text></div></Group></Card>
                <Card withBorder radius="md" p="md"><Group><ThemeIcon variant="light" color="red" size="lg"><IconX size={20} /></ThemeIcon><div><Text size="xs" tt="uppercase" c="dimmed" fw={700}>TOTAL WITHDRAWALS</Text><Text size="lg" fw={700} c="red">{fmt(totalWithdrawals)}</Text></div></Group></Card>
                <Card withBorder radius="md" p="md"><Group><ThemeIcon variant="light" color="teal" size="lg"><IconCheck size={20} /></ThemeIcon><div><Text size="xs" tt="uppercase" c="dimmed" fw={700}>CLEARED BALANCE</Text><Text size="lg" fw={700}>{fmt(clearedBalance)}</Text></div></Group></Card>
            </SimpleGrid>

            <Select label="Select Bank Account" placeholder="Choose account to reconcile" mb="lg" data={bankAccounts.map((a: any) => ({ value: a.id, label: `${a.account_number} — ${a.name}` }))} value={selectedAccount} onChange={setSelectedAccount} />

            <SimpleGrid cols={2}>
                <Paper withBorder radius="md" p="md">
                    <Title order={4} mb="md" c="green">Deposits / Payments Received</Title>
                    <Table striped highlightOnHover>
                        <Table.Thead><Table.Tr><Table.Th>Reference</Table.Th><Table.Th style={{ textAlign: 'right' }}>Amount</Table.Th><Table.Th>Status</Table.Th></Table.Tr></Table.Thead>
                        <Table.Tbody>
                            {paidInvoices.map((inv: any) => (
                                <Table.Tr key={inv.id}>
                                    <Table.Td fw={500}>Payment — {inv.invoice_number}</Table.Td>
                                    <Table.Td style={{ textAlign: 'right' }} c="green">{fmt(inv.amount_paid)}</Table.Td>
                                    <Table.Td><Badge color="green" variant="light" size="sm">CLEARED</Badge></Table.Td>
                                </Table.Tr>
                            ))}
                            {paidInvoices.length === 0 && <Table.Tr><Table.Td colSpan={3}><Text ta="center" c="dimmed" py="lg">No deposits found</Text></Table.Td></Table.Tr>}
                            <Table.Tr style={{ borderTop: '2px solid var(--mantine-color-dark-4)', background: 'var(--mantine-color-dark-6)' }}>
                                <Table.Td fw={700}>TOTAL DEPOSITS</Table.Td><Table.Td style={{ textAlign: 'right' }} fw={700} c="green">{fmt(totalDeposits)}</Table.Td><Table.Td></Table.Td>
                            </Table.Tr>
                        </Table.Tbody>
                    </Table>
                </Paper>

                <Paper withBorder radius="md" p="md">
                    <Title order={4} mb="md" c="red">Checks / Withdrawals</Title>
                    <Table striped highlightOnHover>
                        <Table.Thead><Table.Tr><Table.Th>Reference</Table.Th><Table.Th style={{ textAlign: 'right' }}>Amount</Table.Th><Table.Th>Status</Table.Th></Table.Tr></Table.Thead>
                        <Table.Tbody>
                            {checks.map((chk: any) => (
                                <Table.Tr key={chk.id}>
                                    <Table.Td fw={500}>Check #{chk.check_number}</Table.Td>
                                    <Table.Td style={{ textAlign: 'right' }} c="red">{fmt(chk.amount)}</Table.Td>
                                    <Table.Td><Badge color={chk.status === 'CLEARED' ? 'green' : 'yellow'} variant="light" size="sm">{chk.status}</Badge></Table.Td>
                                </Table.Tr>
                            ))}
                            {checks.length === 0 && <Table.Tr><Table.Td colSpan={3}><Text ta="center" c="dimmed" py="lg">No checks found</Text></Table.Td></Table.Tr>}
                            <Table.Tr style={{ borderTop: '2px solid var(--mantine-color-dark-4)', background: 'var(--mantine-color-dark-6)' }}>
                                <Table.Td fw={700}>TOTAL WITHDRAWALS</Table.Td><Table.Td style={{ textAlign: 'right' }} fw={700} c="red">{fmt(totalWithdrawals)}</Table.Td><Table.Td></Table.Td>
                            </Table.Tr>
                        </Table.Tbody>
                    </Table>
                </Paper>
            </SimpleGrid>

            <Paper withBorder radius="md" p="lg" mt="lg" style={{ background: 'var(--mantine-color-dark-7)' }}>
                <Group justify="space-between">
                    <div><Text size="lg" fw={700}>Reconciliation Summary</Text><Text size="sm" c="dimmed">Statement balance vs cleared transactions</Text></div>
                    <div style={{ textAlign: 'right' }}><Text size="xs" c="dimmed">DIFFERENCE</Text>
                        <Text size="xl" fw={700} c={clearedBalance === accountBalance ? 'green' : 'red'}>{fmt(clearedBalance - accountBalance)}</Text>
                        <Badge color={clearedBalance === accountBalance ? 'green' : 'yellow'} variant="light" size="sm" mt={4}>{clearedBalance === accountBalance ? 'RECONCILED' : 'UNRECONCILED'}</Badge>
                    </div>
                </Group>
            </Paper>
        </div>
    );
}
