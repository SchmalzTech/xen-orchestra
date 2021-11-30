import tar from 'tar-stream'
import { computeVmdkLength, vhdToVMDKIterator } from '.'
import { fromCallback } from 'promise-toolbox'

/**
 *
 * @param writeStream
 * @param vmName
 * @param vmDescription
 * @param disks [{name, capacityMB, getStream}]
 * @returns readStream
 */
export async function writeOvaOn(writeStream, { vmName, vmDescription = '', disks = [] }) {
  const ovf = createOvf(vmName, vmDescription, disks)
  const pack = tar.pack()
  const pipe = pack.pipe(writeStream)
  await fromCallback.call(pack, pack.entry, { name: `${vmName}.ovf` }, Buffer.from(ovf, 'utf8'))

  async function writeDisk(entry, blockIterator) {
    for await(const block of blockIterator) {
      entry.write(block)
    }
  }

// https://github.com/mafintosh/tar-stream/issues/24#issuecomment-558358268
  async function pushDisk(disk) {
    const size = await computeVmdkLength(disk.name, await disk.getStream())
    disk.fileSize = size
    const blockIterator = await vhdToVMDKIterator(disk.name, await disk.getStream())
    return new Promise((resolve, reject) => {
      const entry = pack.entry({ name: `${disk.name}.vmdk`, size: size }, (err) => {
        if (err == null) {
          return resolve()
        } else
          return reject(err)
      })
      return writeDisk(entry, blockIterator).then(() => entry.end(), e => reject(e))
    })
  }

  for (const disk of disks) {
    await pushDisk(disk)
  }
  pack.finalize()
  return pipe
}

function createDiskSection(disks) {
  const fileReferences = []
  const diskFragments = []
  const diskItems = []
  for (let i = 0; i < disks.length; i++) {
    const disk = disks[i]
    const diskId = `vmdisk${i + 1}`
    fileReferences.push(`    <File ovf:href="${disk.fileName}" ovf:id="file${i + 1}"/>`)
    diskFragments.push(`    <Disk ovf:capacity="${disk.capacityMB}" ovf:capacityAllocationUnits="byte * 2^20" ovf:diskId="${diskId}" ovf:fileRef="file${i + 1}" />`)
    diskItems.push(`
      <Item>
        <rasd:AddressOnParent>${i}</rasd:AddressOnParent>
        <rasd:ElementName>Hard Disk ${i + 1}</rasd:ElementName>
        <rasd:HostResource>ovf:/disk/${diskId}</rasd:HostResource>
        <rasd:InstanceID>${diskId}</rasd:InstanceID>
        <rasd:Parent>4</rasd:Parent>
        <rasd:ResourceType>17</rasd:ResourceType>
      </Item>
    `)
  }
  return {
    fileReferences: fileReferences.join('\n'),
    diskFragments: diskFragments.join('\n'),
    diskItems: diskItems.join('\n')
  }
}

function createOvf(vmName, vmDescription, disks, vmMemoryMB=64) {
  const diskSection = createDiskSection(disks)
  let id = 1
  const nextId = () => id++

  return `<?xml version="1.0" encoding="UTF-8"?>
<!--Generated by Xen Orchestra-->
<ovf:Envelope xmlns="http://schemas.dmtf.org/ovf/envelope/1" xmlns:ovf="http://schemas.dmtf.org/ovf/envelope/1"
    xmlns:rasd="http://schemas.dmtf.org/wbem/wscim/1/cim-schema/2/CIM_ResourceAllocationSettingData"
    xmlns:vssd="http://schemas.dmtf.org/wbem/wscim/1/cim-schema/2/CIM_VirtualSystemSettingData">
  <References>
    ${diskSection.fileReferences}
  </References>
  <DiskSection>
    <Info>Virtual disk information</Info>
    ${diskSection.diskFragments}
  </DiskSection>
  <NetworkSection>
    <Info>The list of logical networks</Info>
    <Network ovf:name="LAN">
      <Description>The LAN network</Description>
    </Network>
  </NetworkSection>
  <VirtualSystem ovf:id="${nextId()}">
    <Info>A virtual machine</Info>
    <Name>${vmName}</Name>
    <OperatingSystemSection ovf:id="${nextId()}">
      <Info>The kind of installed guest operating system</Info>
    </OperatingSystemSection>
    <VirtualHardwareSection>
      <Info>Virtual hardware requirements</Info>
      <System>
        <vssd:ElementName>Virtual Hardware Family</vssd:ElementName>
        <vssd:InstanceID>0</vssd:InstanceID>
        <vssd:VirtualSystemIdentifier>${vmName}</vssd:VirtualSystemIdentifier>
        <vssd:VirtualSystemType>vmx-11</vssd:VirtualSystemType>
      </System>
      <Item>
        <rasd:AllocationUnits>hertz * 10^6</rasd:AllocationUnits>
        <rasd:Description>Number of Virtual CPUs</rasd:Description>
        <rasd:ElementName>1 virtual CPU(s)</rasd:ElementName>
        <rasd:InstanceID>1</rasd:InstanceID>
        <rasd:ResourceType>3</rasd:ResourceType>
        <rasd:VirtualQuantity>1</rasd:VirtualQuantity>
      </Item>
      <Item>
        <rasd:AllocationUnits>byte * 2^20</rasd:AllocationUnits>
        <rasd:Description>Memory Size</rasd:Description>
        <rasd:ElementName>${vmMemoryMB}MB of memory</rasd:ElementName>
        <rasd:InstanceID>2</rasd:InstanceID>
        <rasd:ResourceType>4</rasd:ResourceType>
        <rasd:VirtualQuantity>${vmMemoryMB}</rasd:VirtualQuantity>
      </Item>
      <Item>
        <rasd:Address>0</rasd:Address>
        <rasd:Description>IDE Controller</rasd:Description>
        <rasd:ElementName>VirtualIDEController 0</rasd:ElementName>
        <rasd:InstanceID>4</rasd:InstanceID>
        <rasd:ResourceType>5</rasd:ResourceType>
      </Item>
      <Item ovf:required="false">
        <rasd:AutomaticAllocation>false</rasd:AutomaticAllocation>
        <rasd:ElementName>VirtualVideoCard</rasd:ElementName>
        <rasd:InstanceID>5</rasd:InstanceID>
        <rasd:ResourceType>24</rasd:ResourceType>
      </Item>
      ${diskSection.diskItems}
      <Item>
        <rasd:AddressOnParent>7</rasd:AddressOnParent>
        <rasd:AutomaticAllocation>true</rasd:AutomaticAllocation>
        <rasd:Connection>LAN</rasd:Connection>
        <rasd:Description>PCNet32 ethernet adapter on "LAN"</rasd:Description>
        <rasd:ElementName>Ethernet 1</rasd:ElementName>
        <rasd:InstanceID>9</rasd:InstanceID>
        <rasd:ResourceSubType>PCNet32</rasd:ResourceSubType>
        <rasd:ResourceType>10</rasd:ResourceType>
      </Item>
    </VirtualHardwareSection>
    <AnnotationSection ovf:required="false">
      <Info>A human-readable annotation</Info>
      <Annotation>${vmDescription}</Annotation>
    </AnnotationSection>
  </VirtualSystem>
</ovf:Envelope>`
}
