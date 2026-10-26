package com.xxxx.ddd.application.model;

import lombok.Data;

import java.util.List;

@Data
public class OrgDirectoryDTO {
    private List<PositionDTO> positions;
    private List<OrgUnitDTO> units;
    private List<OrgPersonDTO> people;
}
