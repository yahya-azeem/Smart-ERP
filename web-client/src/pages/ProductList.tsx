import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { apiClient } from '../api/client';
import { DenseTable } from '../components/DenseTable';
import { Button, Group, Title, Modal, TextInput, NumberInput, Select, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';

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
  });

  const mutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      await apiClient.post('/products', values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      close();
      form.reset();
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Title order={2}>Products</Title>
        <Button onClick={open}>New Product</Button>
      </Group>
      <DenseTable data={products || []} columns={columns} />

      <Modal opened={opened} onClose={close} title="Create New Product">
        <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
            <Stack>
                <TextInput label="Name" required {...form.getInputProps('name')} />
                <TextInput label="SKU" required {...form.getInputProps('sku')} />
                <Select 
                    label="Unit of Measure" 
                    data={['UNIT', 'SQ_FT', 'KG', 'PIECE', 'METER', 'LITER']} 
                    {...form.getInputProps('unit_of_measure')} 
                />
                <NumberInput label="Price" prefix="$" {...form.getInputProps('price')} />
                <NumberInput label="Cost Price" prefix="$" {...form.getInputProps('cost_price')} />
                <TextInput label="Description" {...form.getInputProps('description')} />
                <Button type="submit" loading={mutation.isPending}>Create</Button>
            </Stack>
        </form>
      </Modal>
    </div>
  );
}
