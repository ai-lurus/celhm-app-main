import { PrismaClient, Role, TicketState, MovementType, TicketPartState, NotificationChannel } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo organization
  const organization = await prisma.organization.upsert({
    where: { slug: 'acme-repair' },
    update: {},
    create: {
      name: 'Acme Repair',
      slug: 'acme-repair',
    },
  });

  console.log('✅ Created organization:', organization.name);

  // Create demo branch
  const branch = await prisma.branch.upsert({
    where: { 
      organizationId_code: {
        organizationId: organization.id,
        code: 'SUC01'
      }
    },
    update: {},
    create: {
      organizationId: organization.id,
      code: 'SUC01',
      name: 'Sucursal Centro',
      address: 'Av. Principal 123, Centro',
      phone: '+52 555 123 4567',
      email: 'centro@acme-repair.com',
    },
  });

  console.log('✅ Created branch:', branch.name);

  // Create demo users
  const hashedPassword = await hash('ChangeMe123!', 10);
  
  const users = [
    {
      email: 'direccion@acme-repair.com',
      name: 'Juan Pérez',
      role: Role.DIRECCION,
      authUserId: 'mock-auth-user-1',
    },
    {
      email: 'admon@acme-repair.com',
      name: 'María García',
      role: Role.ADMON,
      authUserId: 'mock-auth-user-2',
    },
    {
      email: 'laboratorio@acme-repair.com',
      name: 'Carlos López',
      role: Role.LABORATORIO,
      authUserId: 'mock-auth-user-3',
    },
  ];

  const createdUsers = [];
  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        defaultOrganizationId: organization.id,
        branchId: branch.id,
      },
    });

    // Create organization membership
    await prisma.orgMembership.upsert({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: user.id,
        },
      },
      update: {},
      create: {
        organizationId: organization.id,
        userId: user.id,
        role: userData.role,
      },
    });

    createdUsers.push(user);
    console.log('✅ Created user:', user.name, `(${user.role})`);
  }

  // Create demo products and variants
  const products = [
    {
      name: 'Pantalla LCD iPhone',
      description: 'Pantalla LCD para iPhone 12/13',
      category: 'Pantallas',
      brand: 'Apple',
      model: 'iPhone 12/13',
      variants: [
        { sku: 'LCD-IP12-BLK', name: 'Pantalla LCD iPhone 12 Negro', color: 'Negro' },
        { sku: 'LCD-IP12-WHT', name: 'Pantalla LCD iPhone 12 Blanco', color: 'Blanco' },
        { sku: 'LCD-IP13-BLK', name: 'Pantalla LCD iPhone 13 Negro', color: 'Negro' },
      ],
    },
    {
      name: 'Batería Samsung Galaxy',
      description: 'Batería original Samsung Galaxy S21',
      category: 'Baterías',
      brand: 'Samsung',
      model: 'Galaxy S21',
      variants: [
        { sku: 'BAT-SGS21-4000', name: 'Batería Samsung Galaxy S21 4000mAh', color: 'Negro' },
      ],
    },
    {
      name: 'Cargador USB-C',
      description: 'Cargador rápido USB-C 20W',
      category: 'Accesorios',
      brand: 'Generic',
      model: 'USB-C 20W',
      variants: [
        { sku: 'CHG-USBC-20W-BLK', name: 'Cargador USB-C 20W Negro', color: 'Negro' },
        { sku: 'CHG-USBC-20W-WHT', name: 'Cargador USB-C 20W Blanco', color: 'Blanco' },
      ],
    },
    {
      name: 'Cable Lightning',
      description: 'Cable Lightning 1m',
      category: 'Cables',
      brand: 'Generic',
      model: 'Lightning 1m',
      variants: [
        { sku: 'CBL-LIGHT-1M-BLK', name: 'Cable Lightning 1m Negro', color: 'Negro' },
        { sku: 'CBL-LIGHT-1M-WHT', name: 'Cable Lightning 1m Blanco', color: 'Blanco' },
      ],
    },
    {
      name: 'Protector de Pantalla',
      description: 'Protector de pantalla templado',
      category: 'Accesorios',
      brand: 'Generic',
      model: 'Templado',
      variants: [
        { sku: 'PROT-TEMP-IP12', name: 'Protector iPhone 12', color: 'Transparente' },
        { sku: 'PROT-TEMP-IP13', name: 'Protector iPhone 13', color: 'Transparente' },
        { sku: 'PROT-TEMP-SGS21', name: 'Protector Samsung Galaxy S21', color: 'Transparente' },
      ],
    },
  ];

  const createdVariants = [];
  for (const productData of products) {
    const product = await prisma.product.upsert({
      where: { name: productData.name },
      update: {},
      create: {
        name: productData.name,
        description: productData.description,
        category: productData.category,
        brand: productData.brand,
        model: productData.model,
      },
    });

    for (const variantData of productData.variants) {
      const variant = await prisma.variant.upsert({
        where: { sku: variantData.sku },
        update: {},
        create: {
          productId: product.id,
          sku: variantData.sku,
          name: variantData.name,
          description: `${productData.description} - ${variantData.color}`,
          brand: productData.brand,
          model: productData.model,
          color: variantData.color,
          price: Math.floor(Math.random() * 2000) + 100, // Random price between 100-2100
        },
      });
      createdVariants.push(variant);
    }
  }

  console.log('✅ Created products and variants:', createdVariants.length);

  // Create demo stocks
  for (const variant of createdVariants) {
    await prisma.stock.upsert({
      where: {
        branchId_variantId: {
          branchId: branch.id,
          variantId: variant.id,
        },
      },
      update: {},
      create: {
        branchId: branch.id,
        variantId: variant.id,
        qty: Math.floor(Math.random() * 50) + 5, // Random stock between 5-55
        min: 5,
        max: 100,
        reserved: 0,
      },
    });
  }

  console.log('✅ Created stocks for all variants');

  // Create demo tickets
  const tickets = [
    {
      folio: 'LAB-SUC01-202412-0001',
      customerName: 'Ana Rodríguez',
      customerPhone: '+52 555 987 6543',
      customerEmail: 'ana.rodriguez@email.com',
      device: 'iPhone 12',
      brand: 'Apple',
      model: 'iPhone 12',
      serialNumber: 'ABC123456789',
      problem: 'Pantalla rota, no enciende',
      state: TicketState.RECIBIDO,
      estimatedCost: 2500,
      estimatedTime: 2,
    },
    {
      folio: 'LAB-SUC01-202412-0002',
      customerName: 'Roberto Silva',
      customerPhone: '+52 555 111 2222',
      device: 'Samsung Galaxy S21',
      brand: 'Samsung',
      model: 'Galaxy S21',
      problem: 'Batería no carga, se descarga rápido',
      state: TicketState.DIAGNOSTICO,
      estimatedCost: 800,
      estimatedTime: 1,
    },
    {
      folio: 'LAB-SUC01-202412-0003',
      customerName: 'Laura Martínez',
      customerPhone: '+52 555 333 4444',
      device: 'iPhone 13',
      brand: 'Apple',
      model: 'iPhone 13',
      problem: 'Cargador no funciona',
      state: TicketState.ESPERANDO_PIEZA,
      estimatedCost: 300,
      estimatedTime: 1,
    },
    {
      folio: 'LAB-SUC01-202412-0004',
      customerName: 'Miguel Torres',
      customerPhone: '+52 555 555 6666',
      device: 'iPhone 12',
      brand: 'Apple',
      model: 'iPhone 12',
      problem: 'Cambio de pantalla',
      state: TicketState.EN_REPARACION,
      estimatedCost: 2500,
      estimatedTime: 2,
    },
  ];

  const createdTickets = [];
  for (const ticketData of tickets) {
    const ticket = await prisma.ticket.upsert({
      where: { folio: ticketData.folio },
      update: {},
      create: {
        ...ticketData,
        branchId: branch.id,
        userId: createdUsers[2].id, // Laboratorio user
      },
    });

    // Create ticket history
    await prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        toState: ticketData.state,
        notes: 'Ticket creado',
        userId: createdUsers[2].id,
      },
    });

    createdTickets.push(ticket);
  }

  console.log('✅ Created tickets:', createdTickets.length);

  // Create demo movements
  const movements = [
    {
      type: MovementType.ING,
      qty: 20,
      reason: 'Compra inicial',
      folio: 'ING-SUC01-202412-0001',
    },
    {
      type: MovementType.ING,
      qty: 15,
      reason: 'Reposición stock',
      folio: 'ING-SUC01-202412-0002',
    },
    {
      type: MovementType.VTA,
      qty: 2,
      reason: 'Venta directa',
      folio: 'VTA-SUC01-202412-0001',
    },
  ];

  for (const movementData of movements) {
    // Create movements for first 3 variants
    for (let i = 0; i < 3; i++) {
      await prisma.movement.create({
        data: {
          ...movementData,
          branchId: branch.id,
          variantId: createdVariants[i].id,
          userId: createdUsers[1].id, // Admon user
        },
      });
    }
  }

  console.log('✅ Created demo movements');

  // Create notification templates
  const templates = [
    {
      channel: NotificationChannel.EMAIL,
      code: 'ticket_state_changed',
      name: 'Cambio de Estado - Email',
      bodyMdx: `# Estado de Ticket Actualizado

Hola {{customerName}},

Tu ticket **{{folio}}** ha cambiado de estado a **{{state}}**.

**Sucursal:** {{branchName}}  
**Fecha:** {{updatedAt}}

{{#if notes}}
**Notas:** {{notes}}
{{/if}}

Gracias por confiar en nosotros.`,
    },
    {
      channel: NotificationChannel.WHATSAPP,
      code: 'ticket_state_changed',
      name: 'Cambio de Estado - WhatsApp',
      bodyMdx: `🔧 *Actualización de Ticket*

Hola {{customerName}},

Tu ticket *{{folio}}* ha cambiado a *{{state}}*.

📍 Sucursal: {{branchName}}  
📅 Fecha: {{updatedAt}}

{{#if notes}}
📝 Notas: {{notes}}
{{/if}}

¡Gracias por confiar en nosotros!`,
    },
    {
      channel: NotificationChannel.SMS,
      code: 'ticket_state_changed',
      name: 'Cambio de Estado - SMS',
      bodyMdx: `Ticket {{folio}} - Estado: {{state}}. Sucursal: {{branchName}}. Fecha: {{updatedAt}}. {{#if notes}}Notas: {{notes}}{{/if}}`,
    },
  ];

  for (const templateData of templates) {
    await prisma.notificationTemplate.upsert({
      where: {
        organizationId_channel_code: {
          organizationId: organization.id,
          channel: templateData.channel,
          code: templateData.code,
        },
      },
      update: {},
      create: {
        ...templateData,
        organizationId: organization.id,
      },
    });
  }

  console.log('✅ Created notification templates');

  // Create folio sequences
  const prefixes = ['LAB', 'VTA', 'ING', 'EGR'];
  const currentPeriod = new Date().toISOString().slice(0, 7).replace('-', ''); // YYYYMM

  for (const prefix of prefixes) {
    await prisma.folioSequence.upsert({
      where: {
        prefix_branchId_period: {
          prefix,
          branchId: branch.id,
          period: currentPeriod,
        },
      },
      update: {},
      create: {
        branchId: branch.id,
        prefix,
        period: currentPeriod,
        seq: 0,
      },
    });
  }

  console.log('✅ Created folio sequences');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

