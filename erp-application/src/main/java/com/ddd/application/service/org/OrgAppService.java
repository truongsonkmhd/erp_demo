package com.xxxx.ddd.application.service.org;

import com.xxxx.ddd.application.model.OrgDirectoryDTO;
import com.xxxx.ddd.application.model.OrgPersonDTO;
import com.xxxx.ddd.application.model.PositionDTO;
import com.xxxx.ddd.domain.model.entity.User;

import java.util.List;

public interface OrgAppService {
    /** Positions, the unit tree and every active person's position and unit. */
    OrgDirectoryDTO directory();

    List<PositionDTO> positions();

    /** People the signed-in user may assign work/KPI to (permission is checked by the caller). */
    List<OrgPersonDTO> assignees();

    /** Throws AccessDeniedException unless the signed-in user manages the target user. */
    void requireCanAssign(Long targetUserId);

    /** Codes of the units the user manages. */
    List<String> managedUnitCodes(User user);
}
