import { Grid, Paper, Title, Text, Group, ScrollArea, Table, Button, TextInput, Avatar, Stack, Badge } from '@mantine/core';
import { useState } from 'react';
import { IconSearch, IconPlus, IconPhone, IconMail, IconMapPin } from '@tabler/icons-react';

// Mock Data matching the Seed Data
const CUSTOMERS = [
  { id: '1', name: 'Luxury Auto Interiors', email: 'purchasing@luxauto.com', phone: '555-0101', balance: 12500.00 },
  { id: '2', name: 'Italian Shoe Crafters', email: 'mario@shoes.it', phone: '555-0102', balance: 0.00 },
  { id: '3', name: 'Classic Furniture Works', email: 'supply@classicworks.com', phone: '555-0103', balance: 4250.00 },
  { id: '4', name: 'Bespoke Bags NYC', email: 'design@bespokebags.com', phone: '555-0104', balance: 0.00 },
];

const TRANSACTIONS = [
  { id: '1', date: '2023-12-01', type: 'Invoice', num: 'INV-1001', amount: 8500.00, status: 'PAID' },
  { id: '2', date: '2023-12-15', type: 'Invoice', num: 'INV-1002', amount: 12500.00, status: 'OVERDUE' },
  { id: '3', date: '2024-01-10', type: 'Payment', num: 'PMT-001', amount: -8500.00, status: 'CLEARED' },
];

export function CustomerCenter() {
  const [selectedId, setSelectedId] = useState<string>(CUSTOMERS[0].id);
  const [search, setSearch] = useState('');

  const selectedCustomer = CUSTOMERS.find(c => c.id === selectedId);

  const filteredCustomers = CUSTOMERS.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      <Group justify="space-between" mb="md">
        <Title order={3}>Customer Center</Title>
        <Group>
            <Button leftSection={<IconPlus size={16} />}>New Customer</Button>
            <Button variant="light">New Transaction</Button>
        </Group>
      </Group>

      <Grid style={{ flex: 1, overflow: 'hidden' }}>
        <Grid.Col span={3} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <TextInput 
            placeholder="Search customers" 
            leftSection={<IconSearch size={16} />} 
            mb="xs"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
          <Paper withBorder style={{ flex: 1 }} p={0}>
            <ScrollArea h="100%">
              {filteredCustomers.map(c => (
                <div 
                    key={c.id} 
                    onClick={() => setSelectedId(c.id)}
                    style={{ 
                        padding: '10px 15px', 
                        cursor: 'pointer',
                        backgroundColor: selectedId === c.id ? '#e7f5ff' : 'transparent',
                        borderBottom: '1px solid #eee'
                    }}
                >
                    <Text fw={500} size="sm">{c.name}</Text>
                    <Text size="xs" c="dimmed">Bal: ${c.balance.toLocaleString()}</Text>
                </div>
              ))}
            </ScrollArea>
          </Paper>
        </Grid.Col>

        <Grid.Col span={9} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Paper withBorder p="md" mb="md" radius="md">
                <Group align="flex-start">
                    <Avatar size="lg" color="blue">{selectedCustomer?.name.charAt(0)}</Avatar>
                    <div style={{ flex: 1 }}>
                        <Title order={4}>{selectedCustomer?.name}</Title>
                        <Group mt="xs" gap="xl">
                            <Group gap={5}>
                                <IconMail size={16} color="gray" />
                                <Text size="sm">{selectedCustomer?.email}</Text>
                            </Group>
                            <Group gap={5}>
                                <IconPhone size={16} color="gray" />
                                <Text size="sm">{selectedCustomer?.phone}</Text>
                            </Group>
                            <Group gap={5}>
                                <IconMapPin size={16} color="gray" />
                                <Text size="sm">123 Business Rd, Industry City</Text>
                            </Group>
                        </Group>
                    </div>
                    <Stack align="flex-end" gap={0}>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Open Balance</Text>
                        <Title order={3} c={selectedCustomer?.balance ? 'red' : 'green'}>
                            ${selectedCustomer?.balance.toLocaleString()}
                        </Title>
                    </Stack>
                </Group>
            </Paper>

            <Paper withBorder style={{ flex: 1 }} p={0} radius="md">
                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Date</Table.Th>
                            <Table.Th>Type</Table.Th>
                            <Table.Th>Num</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th style={{ textAlign: 'right' }}>Amount</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {TRANSACTIONS.map(t => (
                            <Table.Tr key={t.id}>
                                <Table.Td>{t.date}</Table.Td>
                                <Table.Td>{t.type}</Table.Td>
                                <Table.Td>{t.num}</Table.Td>
                                <Table.Td>
                                    <Badge color={t.status === 'PAID' ? 'green' : t.status === 'OVERDUE' ? 'red' : 'gray'} size="sm">
                                        {t.status}
                                    </Badge>
                                </Table.Td>
                                <Table.Td style={{ textAlign: 'right' }}>${t.amount.toLocaleString()}</Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Paper>
        </Grid.Col>
      </Grid>
    </div>
  );
}
