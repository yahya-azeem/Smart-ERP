import { Title, Table, Paper, Group, Text, Badge, SimpleGrid, Card, ThemeIcon, TextInput, Tabs } from '@mantine/core';
import { IconCoin, IconSearch, IconUsers } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useState } from 'react';

function fmt(v: any) { return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` }

export function Payroll() {
    const [search, setSearch] = useState('');
    const { data: employees = [] } = useQuery({ queryKey: ['payroll-employees'], queryFn: async () => (await apiClient.get('/employees')).data });

    const filtered = employees.filter((e: any) => `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase()));
    const totalPayroll = employees.reduce((s: number, e: any) => s + Number(e.pay_rate || 0), 0);
    const salaryCount = employees.filter((e: any) => e.pay_type === 'SALARY').length;
    const hourlyCount = employees.filter((e: any) => e.pay_type === 'HOURLY').length;

    return (
        <div>
            <Title order={2} mb="md">Payroll Center</Title>
            <SimpleGrid cols={4} mb="lg">
                <Card withBorder radius="md" p="md"><Group><ThemeIcon variant="light" color="green" size="lg"><IconCoin size={20} /></ThemeIcon><div><Text size="xs" tt="uppercase" c="dimmed" fw={700}>TOTAL PAYROLL</Text><Text size="lg" fw={700}>{fmt(totalPayroll)}/period</Text></div></Group></Card>
                <Card withBorder radius="md" p="md"><Group><ThemeIcon variant="light" color="blue" size="lg"><IconUsers size={20} /></ThemeIcon><div><Text size="xs" tt="uppercase" c="dimmed" fw={700}>EMPLOYEES</Text><Text size="lg" fw={700}>{employees.length}</Text></div></Group></Card>
                <Card withBorder radius="md" p="md"><Text size="xs" tt="uppercase" c="dimmed" fw={700}>SALARY</Text><Text size="lg" fw={700}>{salaryCount}</Text></Card>
                <Card withBorder radius="md" p="md"><Text size="xs" tt="uppercase" c="dimmed" fw={700}>HOURLY</Text><Text size="lg" fw={700}>{hourlyCount}</Text></Card>
            </SimpleGrid>
            <Tabs defaultValue="list">
                <Tabs.List mb="md">
                    <Tabs.Tab value="list">Employee Pay Rates</Tabs.Tab>
                    <Tabs.Tab value="summary">Payroll Summary</Tabs.Tab>
                </Tabs.List>
                <Tabs.Panel value="list">
                    <TextInput placeholder="Search employees..." leftSection={<IconSearch size={16} />} value={search} onChange={e => setSearch(e.currentTarget.value)} mb="md" />
                    <Paper withBorder radius="md">
                        <Table striped highlightOnHover>
                            <Table.Thead><Table.Tr><Table.Th>Employee</Table.Th><Table.Th>Department</Table.Th><Table.Th>Pay Type</Table.Th><Table.Th style={{ textAlign: 'right' }}>Pay Rate</Table.Th><Table.Th>Status</Table.Th></Table.Tr></Table.Thead>
                            <Table.Tbody>
                                {filtered.map((e: any) => (
                                    <Table.Tr key={e.id}>
                                        <Table.Td fw={500}>{e.first_name} {e.last_name}</Table.Td>
                                        <Table.Td>{e.department || '—'}</Table.Td>
                                        <Table.Td><Badge color={e.pay_type === 'SALARY' ? 'blue' : 'green'} variant="light" size="sm">{e.pay_type}</Badge></Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }}>{fmt(e.pay_rate)}{e.pay_type === 'HOURLY' ? '/hr' : '/yr'}</Table.Td>
                                        <Table.Td><Badge color={e.status === 'ACTIVE' ? 'green' : 'gray'} variant="light" size="sm">{e.status}</Badge></Table.Td>
                                    </Table.Tr>
                                ))}
                                {filtered.length === 0 && <Table.Tr><Table.Td colSpan={5}><Text ta="center" c="dimmed" py="xl">No employees found</Text></Table.Td></Table.Tr>}
                            </Table.Tbody>
                        </Table>
                    </Paper>
                </Tabs.Panel>
                <Tabs.Panel value="summary">
                    <Paper withBorder radius="md" p="lg">
                        <Title order={4} mb="md">Payroll Summary by Department</Title>
                        <Table striped>
                            <Table.Thead><Table.Tr><Table.Th>Department</Table.Th><Table.Th style={{ textAlign: 'right' }}>Employees</Table.Th><Table.Th style={{ textAlign: 'right' }}>Total Cost</Table.Th></Table.Tr></Table.Thead>
                            <Table.Tbody>
                                {Object.entries(employees.reduce((acc: any, e: any) => {
                                    const dept = e.department || 'Unassigned';
                                    if (!acc[dept]) acc[dept] = { count: 0, cost: 0 };
                                    acc[dept].count++;
                                    acc[dept].cost += Number(e.pay_rate || 0);
                                    return acc;
                                }, {} as Record<string, { count: number; cost: number }>)).map(([dept, data]: any) => (
                                    <Table.Tr key={dept}>
                                        <Table.Td fw={500}>{dept}</Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }}>{data.count}</Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }}>{fmt(data.cost)}</Table.Td>
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
