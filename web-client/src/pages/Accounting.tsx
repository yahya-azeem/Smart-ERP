import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { apiClient } from '../api/client';
import { DenseTable } from '../components/DenseTable';
import { Title, Badge, SimpleGrid, Paper, Text, Group, ThemeIcon, Loader, Center } from '@mantine/core';
import { IconFileInvoice, IconCoin, IconCash } from '@tabler/icons-react';

interface Invoice {
    id: string;
    customer_id: string;
    sales_order_id: string | null;
    invoice_number: string;
    date: string;
    due_date: string;
    status: string;
    total_amount: string;
    amount_paid: string;
}

interface Payment {
    id: string;
    invoice_id: string;
    amount: string;
    date: string;
    method: string;
    reference: string | null;
}

const invColumnHelper = createColumnHelper<Invoice>();
const invColumns = [
    invColumnHelper.accessor('invoice_number', { header: 'Invoice #' }),
    invColumnHelper.accessor('date', { header: 'Date', cell: info => new Date(info.getValue()).toLocaleDateString() }),
    invColumnHelper.accessor('due_date', { header: 'Due Date', cell: info => new Date(info.getValue()).toLocaleDateString() }),
    invColumnHelper.accessor('status', {
        header: 'Status',
        cell: info => {
            const s = info.getValue();
            const color =
                s === 'PAID' ? 'green' :
                    s === 'OVERDUE' ? 'red' :
                        s === 'PARTIALLY_PAID' ? 'yellow' :
                            s === 'SENT' ? 'blue' :
                                s === 'CANCELLED' ? 'gray' : 'gray';
            return <Badge color={color} size="sm">{s}</Badge>;
        },
    }),
    invColumnHelper.accessor('total_amount', { header: 'Total', cell: info => `$${Number(info.getValue()).toLocaleString()}` }),
    invColumnHelper.accessor('amount_paid', { header: 'Paid', cell: info => `$${Number(info.getValue()).toLocaleString()}` }),
];

const payColumnHelper = createColumnHelper<Payment>();
const payColumns = [
    payColumnHelper.accessor('date', { header: 'Date', cell: info => new Date(info.getValue()).toLocaleDateString() }),
    payColumnHelper.accessor('amount', { header: 'Amount', cell: info => `$${Number(info.getValue()).toLocaleString()}` }),
    payColumnHelper.accessor('method', {
        header: 'Method',
        cell: info => {
            const m = info.getValue();
            const color = m === 'CASH' ? 'green' : m === 'BANK_TRANSFER' ? 'blue' : m === 'CREDIT_CARD' ? 'violet' : 'gray';
            return <Badge color={color} variant="light" size="sm">{m.replace('_', ' ')}</Badge>;
        },
    }),
    payColumnHelper.accessor('reference', { header: 'Reference', cell: info => info.getValue() || '—' }),
];

export function Accounting() {
    const { data: invoices, isLoading: loadingInv } = useQuery({
        queryKey: ['invoices'],
        queryFn: async () => {
            const r = await apiClient.get<Invoice[]>('/accounting/invoices');
            return r.data;
        },
    });

    const { data: payments, isLoading: loadingPay } = useQuery({
        queryKey: ['payments'],
        queryFn: async () => {
            const r = await apiClient.get<Payment[]>('/accounting/payments');
            return r.data;
        },
    });

    const inv = invoices || [];
    const pay = payments || [];
    const totalOutstanding = inv.reduce((s, i) => s + Number(i.total_amount) - Number(i.amount_paid), 0);
    const totalCollected = pay.reduce((s, p) => s + Number(p.amount), 0);
    const overdue = inv.filter(i => i.status === 'OVERDUE').length;

    if (loadingInv || loadingPay) {
        return <Center h={300}><Loader size="lg" /></Center>;
    }

    return (
        <div style={{ padding: 20 }}>
            <Title order={2} mb="lg">Accounting</Title>

            <SimpleGrid cols={3} mb="xl">
                <Paper withBorder p="md" radius="md">
                    <Group>
                        <ThemeIcon size={40} radius="md" variant="light" color="blue">
                            <IconFileInvoice size={24} />
                        </ThemeIcon>
                        <div>
                            <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Invoices</Text>
                            <Text fw={700} size="xl">{inv.length} ({overdue} overdue)</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper withBorder p="md" radius="md">
                    <Group>
                        <ThemeIcon size={40} radius="md" variant="light" color="red">
                            <IconCoin size={24} />
                        </ThemeIcon>
                        <div>
                            <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Outstanding</Text>
                            <Text fw={700} size="xl">${totalOutstanding.toLocaleString()}</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper withBorder p="md" radius="md">
                    <Group>
                        <ThemeIcon size={40} radius="md" variant="light" color="green">
                            <IconCash size={24} />
                        </ThemeIcon>
                        <div>
                            <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Total Collected</Text>
                            <Text fw={700} size="xl">${totalCollected.toLocaleString()}</Text>
                        </div>
                    </Group>
                </Paper>
            </SimpleGrid>

            <Title order={4} mb="sm">Invoices</Title>
            <Paper withBorder mb="xl" radius="md" style={{ overflow: 'hidden' }}>
                <DenseTable data={inv} columns={invColumns} />
            </Paper>

            <Title order={4} mb="sm">Payments</Title>
            <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
                <DenseTable data={pay} columns={payColumns} />
            </Paper>
        </div>
    );
}
