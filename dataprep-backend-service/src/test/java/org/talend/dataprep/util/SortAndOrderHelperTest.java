// ============================================================================
// Copyright (C) 2006-2018 Talend Inc. - www.talend.com
//
// This source code is available under agreement available at
// https://github.com/Talend/data-prep/blob/master/LICENSE
//
// You should have received a copy of the agreement
// along with this program; if not, write to Talend SA
// 9 rue Pages 92150 Suresnes, France
//
// ============================================================================

package org.talend.dataprep.util;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.talend.dataprep.util.SortAndOrderHelper.Order;
import static org.talend.dataprep.util.SortAndOrderHelper.Order.ASC;
import static org.talend.dataprep.util.SortAndOrderHelper.Order.DESC;
import static org.talend.dataprep.util.SortAndOrderHelper.Sort;
import static org.talend.dataprep.util.SortAndOrderHelper.Sort.AUTHOR;
import static org.talend.dataprep.util.SortAndOrderHelper.Sort.CREATION_DATE;
import static org.talend.dataprep.util.SortAndOrderHelper.Sort.DATASET_NAME;
import static org.talend.dataprep.util.SortAndOrderHelper.Sort.LAST_MODIFICATION_DATE;
import static org.talend.dataprep.util.SortAndOrderHelper.Sort.NAME;
import static org.talend.dataprep.util.SortAndOrderHelper.Sort.NB_STEPS;

import java.beans.PropertyEditor;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.junit.Test;
import org.talend.dataprep.api.dataset.DataSetMetadata;
import org.talend.dataprep.api.dataset.RowMetadata;
import org.talend.dataprep.api.preparation.PreparationDTO;
import org.talend.dataprep.api.share.Owner;
import org.talend.dataprep.dataset.service.UserDataSetMetadata;
import org.talend.dataprep.exception.TDPException;

public class SortAndOrderHelperTest {

    @Test
    public void getSortPropertyEditor() {
        PropertyEditor sortPropertyEditor = SortAndOrderHelper.getSortPropertyEditor();
        sortPropertyEditor.setAsText(NAME.camelName());
        Object value = sortPropertyEditor.getValue();
        assertEquals(NAME, value);
    }

    @Test(expected = TDPException.class)
    public void invalidSortPropertyEditor() {
        PropertyEditor sortPropertyEditor = SortAndOrderHelper.getSortPropertyEditor();
        sortPropertyEditor.setAsText("invalid");
    }

    @Test
    public void getOrderPropertyEditor() {
        PropertyEditor sortPropertyEditor = SortAndOrderHelper.getOrderPropertyEditor();
        sortPropertyEditor.setAsText(DESC.camelName());
        Object value = sortPropertyEditor.getValue();
        assertEquals(DESC, value);
    }

    @Test(expected = TDPException.class)
    public void invalidOrderPropertyEditor() {
        PropertyEditor sortPropertyEditor = SortAndOrderHelper.getOrderPropertyEditor();
        sortPropertyEditor.setAsText("invalid");
    }

    @Test
    public void getPreparationComparator_byName() throws Exception {
        assertTrue(getPreparationComparisonByName("aaa", "bbb", ASC) < 0);
        assertTrue(getPreparationComparisonByName("aaa", "bbb", DESC) > 0);
        assertEquals(0, getPreparationComparisonByName("aaa", "aaa", DESC));
        getPreparationComparisonByName("aaa", null, ASC); // does not throw exception
    }

    @Test
    public void getPreparationComparator_byNameUppercaseShouldNotInfluence() throws Exception {
        assertTrue(getPreparationComparisonByName("AAA", "bbb", ASC) < 0);
        assertTrue(getPreparationComparisonByName("aaa", "BBB", ASC) < 0);
        assertTrue(getPreparationComparisonByName("AAA", "bbb", DESC) > 0);
        assertTrue(getPreparationComparisonByName("aaa", "BBB", DESC) > 0);
    }

    @Test
    public void getPreparationComparator_byDatasetName() throws Exception {
        assertTrue(getPreparationComparisonByDatasetName("aaa", "bbb", ASC) < 0);
        assertTrue(getPreparationComparisonByDatasetName("aaa", "bbb", DESC) > 0);
        assertEquals(0, getPreparationComparisonByDatasetName("aaa", "aaa", DESC));
        getPreparationComparisonByDatasetName("aaa", null, DESC);
    }

    @Test
    public void getPreparationComparator_byCreation() throws Exception {
        assertTrue(getPreparationComparisonByCreation(1, 2, ASC) < 0);
        assertTrue(getPreparationComparisonByCreation(1, 2, DESC) > 0);
    }

    @Test
    public void getPreparationComparator_byModification() throws Exception {
        assertTrue(getPreparationComparisonByModification(1, 2, ASC) < 0);
        assertTrue(getPreparationComparisonByModification(1, 2, DESC) > 0);
    }

    @Test
    public void getPreparationComparator_byAuthor() throws Exception {
        assertTrue(getPreparationComparisonByAuthor("aaa", "bbb", ASC) < 0);
        assertTrue(getPreparationComparisonByAuthor("aaa", "bbb", DESC) > 0);
        assertEquals(0, getPreparationComparisonByAuthor("aaa", "aaa", DESC));
        getPreparationComparisonByAuthor("aaa", null, DESC); // No exception
    }

    @Test
    public void getPreparationComparator_bySize() throws Exception {
        assertTrue(getPreparationComparisonBySize(1, 2, ASC) < 0);
        assertTrue(getPreparationComparisonBySize(1, 2, DESC) > 0);
    }

    @Test
    public void getDataSetMetadataComparator_byName() throws Exception {
        assertTrue(getDatasetComparisonByName("aaa", "bbb", ASC) < 0);
        assertTrue(getDatasetComparisonByName("aaa", "bbb", DESC) > 0);
    }

    @Test
    public void getDataSetMetadataComparator_byCreation() throws Exception {
        assertTrue(getDatasetComparisonByCreation(1, 2, ASC) < 0);
        assertTrue(getDatasetComparisonByCreation(1, 2, DESC) > 0);
    }

    @Test
    public void getDataSetMetadataComparator_byModification() throws Exception {
        assertTrue(getDatasetComparisonByModification(1, 2, ASC) < 0);
        assertTrue(getDatasetComparisonByModification(1, 2, DESC) > 0);
    }

    @Test
    public void getDataSetMetadataComparator_byAuthor() throws Exception {
        assertTrue(getDatasetComparisonByAuthor("aaa", "bbb", ASC) < 0);
        assertTrue(getDatasetComparisonByAuthor("aaa", "bbb", DESC) > 0);
    }

    private int getPreparationComparisonByName(String firstName, String secondName, Order order) {
        return getPreparationComparison(firstName, secondName, null, null, 0, 0, 0, 0, 0, 0, null, null, NAME, order);
    }

    private int getPreparationComparisonByAuthor(String firstAuthor, String secondAuthor, Order order) {
        return getPreparationComparison(null, null, firstAuthor, secondAuthor, 0, 0, 0, 0, 0, 0, null, null, AUTHOR,
                order);
    }

    private int getPreparationComparisonByCreation(long firstCreation, long secondCreation, Order order) {
        return getPreparationComparison(null, null, null, null, firstCreation, secondCreation, 0, 0, 0, 0, null, null,
                CREATION_DATE, order);
    }

    private int getPreparationComparisonByModification(int firstModification, int secondModification, Order order) {
        return getPreparationComparison(null, null, null, null, 0, 0, firstModification, secondModification, 0, 0, null,
                null, LAST_MODIFICATION_DATE, order);
    }

    private int getPreparationComparisonBySize(int firstSize, int secondSize, Order order) {
        return getPreparationComparison(null, null, null, null, 0, 0, 0, 0, firstSize, secondSize, null, null, NB_STEPS,
                order);
    }

    private int getPreparationComparisonByDatasetName(String firstDsName, String secondDsName, Order order) {
        return getPreparationComparison(null, null, null, null, 0, 0, 0, 0, 0, 0, firstDsName, secondDsName,
                DATASET_NAME, order);
    }

    private int getPreparationComparison(String firstName, String secondName, //
            String firstAuthor, String secondAuthor, //
            long firstCreation, long secondCreation, //
            long firstModification, long secondModification, //
            long firstSize, long secondSize, //
            String firstDsName, String secondDsName, //
            Sort sort, Order order) {
        PreparationDTO firstUserPrep =
                createUserPreparation(firstName, firstAuthor, firstCreation, firstModification, firstSize, firstDsName);

        PreparationDTO secondUserPrep = createUserPreparation(secondName, secondAuthor, secondCreation,
                secondModification, secondSize, secondDsName);

        PreparationDTO firstPrep =
                createUserPreparation(firstName, firstAuthor, firstCreation, firstModification, firstSize, firstDsName);

        PreparationDTO secondPrep = createUserPreparation(secondName, secondAuthor, secondCreation, secondModification,
                secondSize, secondDsName);

        // when
        Comparator<PreparationDTO> preparationComparator = SortAndOrderHelper.getPreparationComparator(sort, order);

        // then
        assertNotNull(preparationComparator);
        final int userPreparationOrder = preparationComparator.compare(firstUserPrep, secondUserPrep);
        final int preparationOrder = preparationComparator.compare(firstPrep, secondPrep);
        assertEquals(userPreparationOrder, preparationOrder);
        return userPreparationOrder;
    }

    private int getDatasetComparisonByName(String firstName, String secondName, Order order) {
        return getDatasetComparison(firstName, secondName, null, null, "LastName", "LastName", 0, 0, 0, 0, NAME,
                order);
    }

    private int getDatasetComparisonByAuthor(String firstAuthor, String secondAuthor, Order order) {
        return getDatasetComparison(null, null, firstAuthor, secondAuthor, "", "", 0, 0, 0, 0, AUTHOR, order);
    }

    private int getDatasetComparisonByCreation(long firstCreation, long secondCreation, Order order) {
        return getDatasetComparison(null, null, null, null, "LastName", "LastName", firstCreation, secondCreation, 0, 0,
                CREATION_DATE, order);
    }

    private int getDatasetComparisonByModification(int firstModification, int secondModification, Order order) {
        return getDatasetComparison(null, null, null, null, "LastName", "LastName", 0, 0, firstModification,
                secondModification, LAST_MODIFICATION_DATE, order);
    }

    private int getDatasetComparison(String firstName, String secondName, //
            String firstOwnerFirstName, String secondOwnerFirstName, //
            String firstOwnerLastName, String secondOwnerLastName, //
            long firstCreation, long secondCreation, //
            long firstModification, long secondModification, //
            Sort sort, Order order) {
        DataSetMetadata firstUserDatasetMetadata = createUserDatasetMetadata("firstDsId", firstName, "1", firstCreation,
                firstModification, null, null, firstOwnerFirstName, firstOwnerLastName);
        DataSetMetadata secondUserDatasetMetadata = createUserDatasetMetadata("secondDsId", secondName, "2",
                secondCreation, secondModification, null, null, secondOwnerFirstName, secondOwnerLastName);

        // Used to make sure that when using DatasetMetadata instead of UserDatasetMetada the behaviour of the comparison remains
        // the same
        DataSetMetadata firstDatasetMetadata = createDatasetMetadata("firstDsId", firstName, firstCreation,
                firstModification, null, null, firstOwnerFirstName, firstOwnerLastName);
        DataSetMetadata secondDatasetMetadata = createDatasetMetadata("secondDsId", secondName, secondCreation,
                secondModification, null, null, secondOwnerFirstName, secondOwnerLastName);
        // when
        Comparator<DataSetMetadata> preparationComparator =
                SortAndOrderHelper.getDataSetMetadataComparator(sort, order);

        // then
        assertNotNull(preparationComparator);
        final int userDatasetMetadataOrder =
                preparationComparator.compare(firstUserDatasetMetadata, secondUserDatasetMetadata);
        final int datasetMetadataOrder = preparationComparator.compare(firstDatasetMetadata, secondDatasetMetadata);
        // Make sure that when using DatasetMetadata instead of UserDatasetMetada the behaviour of the comparison remains the same
        if (sort != AUTHOR) { // because only user dataset metadata have author
            assertEquals(userDatasetMetadataOrder, datasetMetadataOrder);
        }
        return userDatasetMetadataOrder;
    }

    private DataSetMetadata createUserDatasetMetadata(String id, String name, String author, long creationDate,
            long lastModificationDate, RowMetadata rowMetadata, String appVersion, String ownerName,
            String ownerLastName) {
        UserDataSetMetadata metadata = new UserDataSetMetadata();
        metadata.setId(id);
        metadata.setName(name);
        metadata.setAuthor(author);
        metadata.setCreationDate(creationDate);
        metadata.setLastModificationDate(lastModificationDate);
        metadata.setRowMetadata(rowMetadata);
        metadata.setAppVersion(appVersion);
        metadata.setOwner(new Owner(id, ownerName, ownerLastName));
        return metadata;
    }

    private DataSetMetadata createDatasetMetadata(String id, String name, long creationDate, long lastModificationDate,
            RowMetadata rowMetadata, String appVersion, String ownerName, String ownerLastName) {
        DataSetMetadata metadata = new DataSetMetadata();
        metadata.setId(id);
        metadata.setName(name);
        metadata.setAuthor(new Owner(id, ownerName, ownerLastName).getDisplayName());
        metadata.setCreationDate(creationDate);
        metadata.setLastModificationDate(lastModificationDate);
        metadata.setRowMetadata(rowMetadata);
        metadata.setAppVersion(appVersion);
        return metadata;
    }

    private PreparationDTO createUserPreparation(String name, String author, long creation, long modification,
            long size, String dataSetName) {
        PreparationDTO firstPrep = new PreparationDTO();
        firstPrep.setDataSetName(dataSetName);
        firstPrep.setName(name);
        firstPrep.setAuthor("1234");
        firstPrep.setOwner(new Owner("1234", author, ""));
        firstPrep.setCreationDate(creation);
        firstPrep.setLastModificationDate(modification);
        List<String> steps = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            steps.add(null);
        }
        firstPrep.setSteps(steps);
        return firstPrep;
    }
}
