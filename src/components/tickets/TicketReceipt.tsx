import React from 'react'
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer'
import { Ticket } from '@celhm/types'
import { format } from 'date-fns'

// Register fonts if needed, using default Helvetica for now

const styles = StyleSheet.create({
    page: {
        padding: 20,
        fontSize: 9,
        fontFamily: 'Helvetica',
    },
    section: {
        marginBottom: 20,
        borderBottom: '1px dashed #999',
        paddingBottom: 20,
        height: '50%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        alignItems: 'center',
    },
    logo: {
        width: 60,
        height: 40,
        justifyContent: 'center',
    },
    logoText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a365d',
    },
    headerTitle: {
        textAlign: 'center',
        flex: 1,
    },
    companyName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1a365d',
        textTransform: 'uppercase',
    },
    headerAddress: {
        fontSize: 7,
        textAlign: 'right',
        color: '#666',
    },
    receiptTitleRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 10,
    },
    receiptTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1a365d',
        marginRight: 5,
    },
    folio: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'red',
    },
    row: {
        flexDirection: 'row',
        marginBottom: 4,
        minHeight: 14,
    },
    label: {
        width: 100,
        fontWeight: 'bold',
        color: '#4a5568',
        fontSize: 8,
    },
    value: {
        flex: 1,
        borderBottom: '1px solid #ddd',
        paddingLeft: 4,
        fontSize: 9,
    },
    valueFull: {
        flex: 1,
        borderBottom: '1px solid #ddd',
        paddingLeft: 4,
    },
    gridContainer: {
        flexDirection: 'row',
    },
    leftColumn: {
        width: '75%',
        paddingRight: 10,
    },
    rightColumn: {
        width: '25%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    patternBox: {
        width: 100,
        height: 100,
        border: '2px solid #1a365d',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    dotRow: {
        flexDirection: 'row',
        ustifyContent: 'space-around',
        width: '80%',
        marginVertical: 10,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#1a365d',
        margin: 10,
    },
    terms: {
        fontSize: 6,
        color: '#4a5568',
        textAlign: 'center',
        marginTop: 15,
        marginBottom: 20,
        fontStyle: 'italic',
    },
    signatures: {
        flexDirection: 'row',
        marginTop: 10,
        justifyContent: 'space-between',
    },
    signatureBox: {
        width: '45%',
        borderTop: '1px solid #999',
        paddingTop: 4,
        alignItems: 'center',
    },
    signatureText: {
        fontSize: 7,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        fontSize: 6,
        color: '#999',
    },
})

interface TicketReceiptProps {
    ticket: Ticket
}

const ReceiptCopy = ({ ticket }: { ticket: Ticket }) => (
    <View style={styles.section}>
        {/* Header */}
        <View style={styles.header}>
            <View style={styles.logo}>
                <Text style={styles.logoText}>CELHM</Text>
            </View>
            <View style={styles.headerTitle}>
                <Text style={styles.companyName}>REPARACIÓN Y MANTENIMIENTO DE</Text>
                <Text style={styles.companyName}>EQUIPO ELECTRÓNICOS Y CELULARES</Text>
            </View>
            <View>
                <Text style={styles.headerAddress}>MAGISTERIO 1043</Text>
                <Text style={styles.headerAddress}>Col. LA NORMAL CP. 44270</Text>
                <Text style={styles.headerAddress}>LOCAL 15 Guadalajara, Jalisco</Text>
                <Text style={styles.headerAddress}>(33) 38545850</Text>
            </View>
        </View>

        <View style={styles.receiptTitleRow}>
            <Text style={styles.receiptTitle}>LABORATORIO RECIBIDO</Text>
            <Text style={styles.folio}>{ticket.folio}</Text>
        </View>

        <View style={styles.gridContainer}>
            <View style={styles.leftColumn}>
                <View style={styles.row}>
                    <Text style={styles.label}>ALMACEN:</Text>
                    <Text style={styles.value}>{ticket.branch?.name || 'LA NORMAL'}</Text>
                    <Text style={[styles.label, { width: 50, marginLeft: 10 }]}>FECHA:</Text>
                    <Text style={styles.value}>{format(new Date(ticket.createdAt), 'dd/MM/yyyy')}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>CLIENTE:</Text>
                    <Text style={styles.value}>{ticket.customerName}</Text>
                    <Text style={[styles.label, { width: 50, marginLeft: 10 }]}>ANTICIPO:</Text>
                    <Text style={styles.value}>$ {ticket.advancePayment || 0}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>TELEFONO:</Text>
                    <Text style={styles.value}>{ticket.customerPhone || ''}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>MODELO:</Text>
                    <Text style={styles.value}>{ticket.device} {ticket.model}</Text>
                    <Text style={[styles.label, { width: 40, marginLeft: 10 }]}>SERIE:</Text>
                    <Text style={styles.value}>{ticket.serialNumber || 'S/N'}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>FALLA:</Text>
                    <Text style={styles.value}>{ticket.problem}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>OBSERVACIONES / RIESGO:</Text>
                    <Text style={styles.value}>{ticket.risk || ''}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>ESTADO DEL USO:</Text>
                    <Text style={styles.value}>{ticket.condition || 'BUENO'}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>ACCESORIOS:</Text>
                    <Text style={styles.value}>{ticket.accessories || 'NINGUNO'}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>TIPO DE GARANTIA:</Text>
                    <Text style={styles.value}>{ticket.warrantyDays ? `${ticket.warrantyDays} DÍAS` : 'NO APLICA'}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>COTIZACIÓN APROX:</Text>
                    <Text style={styles.value}>$ {ticket.estimatedCost || 0}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>RECIBE:</Text>
                    <Text style={styles.value}>STAFF</Text>
                    {/* TODO: Add receiving user name if available */}
                    <Text style={[styles.label, { width: 50, marginLeft: 10 }]}>CODIGO:</Text>
                    <Text style={styles.value}>41414141/Sr200725</Text>
                </View>
            </View>

            <View style={styles.rightColumn}>
                <View style={styles.patternBox}>
                    <View style={{ flexDirection: 'row' }}>
                        <View style={styles.dot} />
                        <View style={styles.dot} />
                        <View style={styles.dot} />
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        <View style={styles.dot} />
                        <View style={styles.dot} />
                        <View style={styles.dot} />
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        <View style={styles.dot} />
                        <View style={styles.dot} />
                        <View style={styles.dot} />
                    </View>
                </View>
            </View>
        </View>

        <Text style={styles.terms}>
            Nota: Sin el presente recibo no se entregara aparato alguno. En caso de extravío de este folio exclusivamente se hará entrega al propietario,
            quien tendrá que presentar una identificación oficial (IFE/INE, cédula profesional, licencia de conducir o pasaporte vigentes). DESPUÉS DE 30
            DÍAS NO NOS HACEMOS RESPONSABLES POR NINGÚN EQUIPO. En equipos mojados, golpeados, intervenidos o que hayan tenido uso inadecuado
            NO HAY GARANTÍA. TODA REVISIÓN GENERA UN COSTO DE $50 a $100 (según el modelo).
        </Text>

        <View style={styles.signatures}>
            <View style={styles.signatureBox}>
                <Text style={styles.signatureText}>NOMBRE Y FIRMA DEL CLIENTE</Text>
                <Text style={styles.signatureText}>(ACEPTO CONDICIONES DE RIESGO)</Text>
            </View>
            <View style={styles.signatureBox}>
                <Text style={styles.signatureText}>NOMBRE Y FIRMA DEL VENDEDOR</Text>
            </View>
        </View>

        <View style={styles.footer}>
            <Text>STAFF ({format(new Date(), 'dd/MM/yyyy - HH:mm:ss')})</Text>
            <Text>Página 1/1</Text>
        </View>
    </View>
)

export const TicketReceiptDocument = ({ ticket }: TicketReceiptProps) => (
    <Document>
        <Page size="LETTER" style={styles.page}>
            <ReceiptCopy ticket={ticket} />
            <ReceiptCopy ticket={ticket} />
        </Page>
    </Document>
)
