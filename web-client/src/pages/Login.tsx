import {
  TextInput,
  PasswordInput,
  Checkbox,
  Anchor,
  Paper,
  Title,
  Text,
  Container,
  Group,
  Button,
} from '@mantine/core';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';

export function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.post('/auth/login', { username, password });
      login(res.data.token, res.data.user);
    } catch (err: any) {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">
        Welcome back to Smart ERP
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Do not have an account yet?{' '}
        <Anchor size="sm" component="button">
          Contact Admin
        </Anchor>
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <TextInput 
            label="Username" 
            placeholder="admin" 
            required 
            value={username}
            onChange={(e) => setUsername(e.currentTarget.value)}
        />
        <PasswordInput 
            label="Password" 
            placeholder="Your password" 
            required 
            mt="md" 
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
        />
        
        {error && <Text c="red" size="sm" mt="sm">{error}</Text>}

        <Group justify="space-between" mt="lg">
          <Checkbox label="Remember me" />
          <Anchor component="button" size="sm">
            Forgot password?
          </Anchor>
        </Group>
        <Button fullWidth mt="xl" onClick={handleLogin} loading={loading}>
          Sign in
        </Button>
      </Paper>
    </Container>
  );
}
