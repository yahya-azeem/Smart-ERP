import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { apiClient } from '../api/client';
import { DenseTable } from '../components/DenseTable';
import { Title, Badge, SimpleGrid, Paper, Text, Group, ThemeIcon, Loader, Center } from '@mantine/core';
import { IconTools, IconClipboardList, IconFlask } from '@tabler/icons-react';

interface Recipe {
    id: string;
    name: string;
    output_product_id: string;
    output_quantity: string;
    description: string | null;
}

interface WorkOrder {
    id: string;
    recipe_id: string;
    quantity: string;
    status: string;
    start_date: string | null;
    end_date: string | null;
}

const recipeColumnHelper = createColumnHelper<Recipe>();
const recipeColumns = [
    recipeColumnHelper.accessor('name', { header: 'Recipe Name' }),
    recipeColumnHelper.accessor('output_quantity', { header: 'Output Qty', cell: info => Number(info.getValue()).toLocaleString() }),
    recipeColumnHelper.accessor('description', { header: 'Description', cell: info => info.getValue() || '—' }),
];

const woColumnHelper = createColumnHelper<WorkOrder>();
const woColumns = [
    woColumnHelper.accessor('id', { header: 'Work Order ID', cell: info => info.getValue().slice(0, 8) + '…' }),
    woColumnHelper.accessor('quantity', { header: 'Quantity', cell: info => Number(info.getValue()).toLocaleString() }),
    woColumnHelper.accessor('status', {
        header: 'Status',
        cell: info => {
            const status = info.getValue();
            const color =
                status === 'COMPLETED' ? 'green' :
                    status === 'IN_PROGRESS' ? 'blue' :
                        status === 'CANCELLED' ? 'red' : 'gray';
            return <Badge color={color} size="sm">{status}</Badge>;
        },
    }),
    woColumnHelper.accessor('start_date', { header: 'Start Date', cell: info => info.getValue() ? new Date(info.getValue()!).toLocaleDateString() : '—' }),
    woColumnHelper.accessor('end_date', { header: 'End Date', cell: info => info.getValue() ? new Date(info.getValue()!).toLocaleDateString() : '—' }),
];

export function Manufacturing() {
    const { data: recipes, isLoading: loadingRecipes } = useQuery({
        queryKey: ['recipes'],
        queryFn: async () => {
            const r = await apiClient.get<Recipe[]>('/manufacturing/recipes');
            return r.data;
        },
    });

    const { data: workOrders, isLoading: loadingWO } = useQuery({
        queryKey: ['work-orders'],
        queryFn: async () => {
            const r = await apiClient.get<WorkOrder[]>('/manufacturing/work-orders');
            return r.data;
        },
    });

    const rec = recipes || [];
    const wo = workOrders || [];
    const completed = wo.filter(x => x.status === 'COMPLETED').length;
    const inProgress = wo.filter(x => x.status === 'IN_PROGRESS').length;

    if (loadingRecipes || loadingWO) {
        return <Center h={300}><Loader size="lg" /></Center>;
    }

    return (
        <div style={{ padding: 20 }}>
            <Title order={2} mb="lg">Manufacturing</Title>

            <SimpleGrid cols={3} mb="xl">
                <Paper withBorder p="md" radius="md">
                    <Group>
                        <ThemeIcon size={40} radius="md" variant="light" color="orange">
                            <IconFlask size={24} />
                        </ThemeIcon>
                        <div>
                            <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Recipes / BOMs</Text>
                            <Text fw={700} size="xl">{rec.length}</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper withBorder p="md" radius="md">
                    <Group>
                        <ThemeIcon size={40} radius="md" variant="light" color="blue">
                            <IconClipboardList size={24} />
                        </ThemeIcon>
                        <div>
                            <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Work Orders</Text>
                            <Text fw={700} size="xl">{wo.length}</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper withBorder p="md" radius="md">
                    <Group>
                        <ThemeIcon size={40} radius="md" variant="light" color="green">
                            <IconTools size={24} />
                        </ThemeIcon>
                        <div>
                            <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Status</Text>
                            <Text fw={700} size="xl">{completed} done · {inProgress} active</Text>
                        </div>
                    </Group>
                </Paper>
            </SimpleGrid>

            <Title order={4} mb="sm">Recipes / Bill of Materials</Title>
            <Paper withBorder mb="xl" radius="md" style={{ overflow: 'hidden' }}>
                <DenseTable data={rec} columns={recipeColumns} />
            </Paper>

            <Title order={4} mb="sm">Work Orders</Title>
            <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
                <DenseTable data={wo} columns={woColumns} />
            </Paper>
        </div>
    );
}
