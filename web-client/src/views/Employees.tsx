import { Title, Table, Paper, Group, Text, Badge, SimpleGrid, Card, ThemeIcon, TextInput, Button, Modal, Stack, Select } from '@mantine/core';
import { IconUsersGroup, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useState } from 'react';

const STATUS_COLORS: Record<string, string> = { ACTIVE: 'green', INACTIVE: 'yellow', TERMINATED: 'red' };
const PAY_LABELS: Record<string, string> = { HOURLY: '/hr', SALARY: '/yr' };

export function Employees() {
    const [search, setSearch] = useState('');
    const [addOpen, setAddOpen] = useState(false);
    const [form, setForm] = useState({ first_name: '', last_name: '', email: '', department: '', job_title: '', pay_type: 'HOURLY', pay_rate: 0 });
    const queryClient = useQueryClient();

    const { data: employees = [] } = useQuery({
        queryKey: ['employees'],
        queryFn: async () => { const res = await apiClient.get('/employees'); return res.data; },
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => apiClient.post('/employees', data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }); setAddOpen(false); },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiClient.delete(`/employees/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
    });

    const filtered = employees.filter((e: any) =>
        `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
        (e.department || '').toLowerCase().includes(search.toLowerCase())
    );

    const active = employees.filter((e: any) => e.status === 'ACTIVE').length;
    const departments = [...new Set(employees.map((e: any) => e.department).filter(Boolean))];

    return (
        <div>
            <Group justify="space-between" mb="md">
                <Title order={2}>Employee Center</Title>
                <Button leftSection={<IconPlus size={16} />} onClick={() => setAddOpen(true)}>Add Employee</Button>
            </Group>

            <SimpleGrid cols={3} mb="lg">
                <Card withBorder radius="md" p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg"><IconUsersGroup size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" tt="uppercase" c="dimmed" fw={700}>TOTAL EMPLOYEES</Text>
                            <Text size="lg" fw={700}>{employees.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder radius="md" p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg"><IconUsersGroup size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" tt="uppercase" c="dimmed" fw={700}>ACTIVE</Text>
                            <Text size="lg" fw={700}>{active}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder radius="md" p="md">
                    <Group>
                        <ThemeIcon variant="light" color="violet" size="lg"><IconUsersGroup size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" tt="uppercase" c="dimmed" fw={700}>DEPARTMENTS</Text>
                            <Text size="lg" fw={700}>{departments.length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <TextInput placeholder="Search employees..." leftSection={<IconSearch size={16} />} value={search} onChange={(e) => setSearch(e.currentTarget.value)} mb="md" />

            <Paper withBorder radius="md">
                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>Email</Table.Th>
                            <Table.Th>Department</Table.Th>
                            <Table.Th>Job Title</Table.Th>
                            <Table.Th>Pay Rate</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>Hire Date</Table.Th>
                            <Table.Th w={60}></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filtered.map((e: any) => (
                            <Table.Tr key={e.id}>
                                <Table.Td><Text fw={500}>{e.first_name} {e.last_name}</Text></Table.Td>
                                <Table.Td>{e.email || '—'}</Table.Td>
                                <Table.Td>{e.department || '—'}</Table.Td>
                                <Table.Td>{e.job_title || '—'}</Table.Td>
                                <Table.Td>${Number(e.pay_rate).toLocaleString()}{PAY_LABELS[e.pay_type]}</Table.Td>
                                <Table.Td><Badge color={STATUS_COLORS[e.status] || 'gray'} variant="light" size="sm">{e.status}</Badge></Table.Td>
                                <Table.Td>{new Date(e.hire_date).toLocaleDateString()}</Table.Td>
                                <Table.Td><IconTrash size={16} style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => deleteMutation.mutate(e.id)} /></Table.Td>
                            </Table.Tr>
                        ))}
                        {filtered.length === 0 && <Table.Tr><Table.Td colSpan={8}><Text ta="center" c="dimmed" py="xl">No employees found</Text></Table.Td></Table.Tr>}
                    </Table.Tbody>
                </Table>
            </Paper>

            <Modal opened={addOpen} onClose={() => setAddOpen(false)} title="Add Employee" centered size="lg">
                <Stack>
                    <Group grow>
                        <TextInput label="First Name" required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.currentTarget.value })} />
                        <TextInput label="Last Name" required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.currentTarget.value })} />
                    </Group>
                    <TextInput label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.currentTarget.value })} />
                    <Group grow>
                        <TextInput label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.currentTarget.value })} />
                        <TextInput label="Job Title" value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.currentTarget.value })} />
                    </Group>
                    <Group grow>
                        <Select label="Pay Type" data={[{ label: 'Hourly', value: 'HOURLY' }, { label: 'Salary', value: 'SALARY' }]} value={form.pay_type} onChange={(v) => setForm({ ...form, pay_type: v || 'HOURLY' })} />
                        <TextInput label="Pay Rate" type="number" value={String(form.pay_rate)} onChange={(e) => setForm({ ...form, pay_rate: Number(e.currentTarget.value) })} />
                    </Group>
                    <Button onClick={() => createMutation.mutate(form)} loading={createMutation.isPending}>Add Employee</Button>
                </Stack>
            </Modal>
        </div>
    );
}
