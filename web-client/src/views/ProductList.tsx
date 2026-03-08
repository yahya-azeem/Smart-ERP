import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { apiClient } from '../api/client';
import { DenseTable } from '../components/DenseTable';
import { Button, Group, Title, Modal, TextInput, NumberInput, Select, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';

interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  unit_of_measure: string;
  stock_quantity: string;
  price: string;
}

const columnHelper = createColumnHelper<Product>();

const columns = [
  columnHelper.accessor('sku', { header: 'SKU', cell: info => info.getValue() }),
  columnHelper.accessor('name', { header: 'Name', cell: info => info.getValue() }),
  columnHelper.accessor('unit_of_measure', { header: 'UoM', cell: info => info.getValue() }),
  columnHelper.accessor('stock_quantity', { header: 'Stock', cell: info => info.getValue() }),
  columnHelper.accessor('price', { header: 'Price', cell: info => `$${info.getValue()}` }),
];

export function ProductList() {
  const [opened, { open, close }] = useDisclosure(false);
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await apiClient.get<Product[]>('/products');
      return response.data;
    },
  });

  const form = useForm({
    initialValues: {
      name: '',
      sku: '',
      unit_of_measure: 'UNIT',
      price: 0,
      cost_price: 0,
      description: '',
    },
    validate: {
        name: (value) => (value.length < 2 ? 'Name must have at least 2 letters' : null),
        sku: (value) => (value.length < 2 ? 'SKU must have at least 2 letters' : null),
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      await apiClient.post('/products', values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      notifications.show({
        title: 'Success',
        message: 'Product created successfully',
        color: 'green',
      });
      close();
      form.reset();
    },
    onError: (error: any) => {
        notifications.show({
            title: 'Error',
            message: error.response?.data?.error || 'Failed to create product',
            color: 'red',
        });
    }
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Group justify="space-between" mb="md">
        <Title order={3}>Item List</Title>
        <Button onClick={open}>New Item</Button>
      </Group>
      
      <div style={{ flex: 1, overflow: 'auto' }}>
        <DenseTable data={products || []} columns={columns} />
      </div>

      <Modal opened={opened} onClose={close} title="New Item">
        <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
            <Stack>
                <TextInput label="Item Name" required {...form.getInputProps('name')} />
                <TextInput label="SKU / Part Number" required {...form.getInputProps('sku')} />
                <Select 
                    label="Unit of Measure" 
                    data={['UNIT', 'SQ_FT', 'KG', 'PIECE', 'METER', 'LITER']} 
                    {...form.getInputProps('unit_of_measure')} 
                />
                <NumberInput label="Sales Price" prefix="$" {...form.getInputProps('price')} />
                <NumberInput label="Cost" prefix="$" {...form.getInputProps('cost_price')} />
                <TextInput label="Description" {...form.getInputProps('description')} />
                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={close}>Cancel</Button>
                    <Button type="submit" loading={mutation.isPending}>Save Item</Button>
                </Group>
            </Stack>
        </form>
      </Modal>
    </div>
  );
}
